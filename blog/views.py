from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from taggit.models import Tag

from .forms import CommentForm
from .models import Category, Comment, Post


def _published_posts():
    return Post.objects.filter(status=Post.Status.PUBLISHED, published_at__lte=timezone.now())


def home(request: HttpRequest) -> HttpResponse:
    posts = _published_posts().select_related("author", "category").prefetch_related("tags")
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(request, "blog/home.html", {"page_obj": page_obj})


def post_detail(request: HttpRequest, slug: str) -> HttpResponse:
    post = get_object_or_404(
        _published_posts().select_related("author", "category").prefetch_related("tags"),
        slug=slug,
    )
    comments = (
        post.comments.select_related("user")
        .filter(status=Comment.Status.APPROVED)
        .order_by("created_at")
    )

    form = CommentForm()
    if request.method == "POST":
        if not request.user.is_authenticated:
            return redirect(f"{reverse('login')}?next={request.path}")
        form = CommentForm(request.POST)
        if form.is_valid():
            comment: Comment = form.save(commit=False)
            comment.post = post
            comment.user = request.user
            comment.status = Comment.Status.PENDING
            comment.save()
            return redirect(post.get_absolute_url())

    return render(
        request,
        "blog/post_detail.html",
        {"post": post, "comments": comments, "form": form},
    )


def category_posts(request: HttpRequest, slug: str) -> HttpResponse:
    category = get_object_or_404(Category, slug=slug)
    posts = (
        _published_posts()
        .filter(category=category)
        .select_related("author", "category")
        .prefetch_related("tags")
    )
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(
        request, "blog/post_list.html", {"page_obj": page_obj, "title": category.name}
    )


def tag_posts(request: HttpRequest, slug: str) -> HttpResponse:
    tag = get_object_or_404(Tag, slug=slug)
    posts = (
        _published_posts()
        .filter(tags__slug=slug)
        .select_related("author", "category")
        .prefetch_related("tags")
    )
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(request, "blog/post_list.html", {"page_obj": page_obj, "title": tag.name})


def search(request: HttpRequest) -> HttpResponse:
    q = (request.GET.get("q") or "").strip()
    posts = _published_posts().select_related("author", "category").prefetch_related("tags")
    if q:
        posts = posts.filter(
            Q(title__icontains=q) | Q(excerpt__icontains=q) | Q(content__icontains=q)
        )
    paginator = Paginator(posts, 10)
    page_obj = paginator.get_page(request.GET.get("page"))
    return render(request, "blog/search.html", {"page_obj": page_obj, "q": q})
