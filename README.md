# 博客管理系统（Django）

支持前台文章展示与评论互动，并提供后台内容管理（文章发布、分类、标签、评论审核、用户与权限）。

## 功能概览
- 文章：草稿/发布、Markdown 渲染、摘要、分类、标签
- 分类：增删改查（后台）
- 标签：文章多标签（后台）
- 评论：前台提交、后台审核通过后展示
- 认证：注册、登录、退出；后台仅 staff 可访问

## 本地运行

### 1) 创建环境并安装依赖
```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
```

### 2) 配置环境变量
```bash
cp .env.example .env
```

开发环境最少配置：
- SECRET_KEY：任意字符串即可
- DEBUG：1 或 0

### 3) 迁移数据库并创建管理员
```bash
python manage.py migrate
python manage.py createsuperuser
```

### 4) 启动服务
```bash
python manage.py runserver
```

访问：
- 前台：http://127.0.0.1:8000/
- 后台：http://127.0.0.1:8000/admin/

## 部署（Heroku/兼容平台）
说明：GitHub Pages 仅支持静态站点，不适合直接托管 Django 这类动态应用；建议使用 Heroku 或同类 PaaS（Render、Fly.io 等）。

### 必备文件
- requirements.txt：依赖声明
- Procfile：启动与 release 迁移阶段
- runtime.txt：Python 版本声明

### 平台环境变量建议
- SECRET_KEY：生产环境必须设置
- DEBUG：0
- ALLOWED_HOSTS：如 `your-app.herokuapp.com`
- CSRF_TRUSTED_ORIGINS：如 `https://your-app.herokuapp.com`
- DATABASE_URL：平台通常会自动注入（PostgreSQL）

### GitHub Actions 自动部署（可选）
仓库已提供工作流：
- CI：自动运行测试（.github/workflows/ci.yml）
- Deploy (Heroku)：推送 main 后自动部署（.github/workflows/deploy-heroku.yml）

需要在 GitHub 仓库 Secrets 中配置：
- HEROKU_API_KEY
- HEROKU_APP_NAME
- HEROKU_EMAIL

## 故障排查
- 静态文件 404：确认已设置 `DEBUG=0` 时由 WhiteNoise 提供静态资源；平台需要执行 collectstatic（Heroku 默认会执行）
- 403 CSRF：确认 `CSRF_TRUSTED_ORIGINS` 包含站点 https 域名
- 无法登录后台：确认账号为 staff（可在 admin 的用户管理里勾选）
- 评论不展示：评论默认“待审”，需在后台 Comment 列表中选择“审核通过”
