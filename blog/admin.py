from django.contrib import admin

from .models import Category, Comment, Post


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "created_at")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "status", "published_at", "created_at")
    list_filter = ("status", "category", "created_at", "published_at")
    search_fields = ("title", "excerpt", "content", "slug")
    prepopulated_fields = {"slug": ("title",)}
    autocomplete_fields = ("author",)
    date_hierarchy = "published_at"


@admin.action(description="审核通过")
def approve_comments(modeladmin, request, queryset):
    queryset.update(status=Comment.Status.APPROVED)


@admin.action(description="屏蔽")
def hide_comments(modeladmin, request, queryset):
    queryset.update(status=Comment.Status.HIDDEN)


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ("post", "user", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("content", "post__title", "user__username")
    autocomplete_fields = ("post", "user")
    actions = (approve_comments, hide_comments)
