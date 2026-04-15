from django.urls import path

from . import views

urlpatterns = [
    path("", views.home, name="home"),
    path("post/<str:slug>/", views.post_detail, name="post_detail"),
    path("category/<str:slug>/", views.category_posts, name="category"),
    path("tag/<str:slug>/", views.tag_posts, name="tag"),
    path("search/", views.search, name="search"),
]
