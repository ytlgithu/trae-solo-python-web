from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class AccountsTests(TestCase):
    def test_register_creates_user_and_logs_in(self):
        resp = self.client.post(
            reverse("register"),
            {
                "username": "newuser",
                "email": "n@example.com",
                "password1": "pw12345678",
                "password2": "pw12345678",
            },
        )
        self.assertEqual(resp.status_code, 302)
        self.assertTrue(User.objects.filter(username="newuser").exists())
        resp2 = self.client.get(reverse("home"))
        self.assertEqual(resp2.status_code, 200)
