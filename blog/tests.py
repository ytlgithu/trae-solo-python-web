from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone

from .models import Category, Comment, Post


class BlogFlowTests(TestCase):
    def setUp(self):
        self.author = User.objects.create_user(username="author", password="pw12345678")
        self.reader = User.objects.create_user(username="reader", password="pw12345678")
        self.category = Category.objects.create(name="随笔")
        self.post = Post.objects.create(
            author=self.author,
            category=self.category,
            title="第一篇",
            excerpt="摘要",
            content="# 标题\n\n内容",
            status=Post.Status.PUBLISHED,
            published_at=timezone.now(),
        )

    def test_home_page_lists_posts(self):
        resp = self.client.get(reverse("home"))
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "第一篇")

    def test_post_detail_renders(self):
        resp = self.client.get(self.post.get_absolute_url())
        self.assertEqual(resp.status_code, 200)
        self.assertContains(resp, "第一篇")

    def test_comment_requires_login(self):
        resp = self.client.post(self.post.get_absolute_url(), {"content": "hello"})
        self.assertEqual(resp.status_code, 302)

    def test_comment_submission_creates_pending_comment(self):
        self.client.login(username="reader", password="pw12345678")
        resp = self.client.post(self.post.get_absolute_url(), {"content": "hello"})
        self.assertEqual(resp.status_code, 302)
        comment = Comment.objects.get(post=self.post, user=self.reader)
        self.assertEqual(comment.status, Comment.Status.PENDING)
