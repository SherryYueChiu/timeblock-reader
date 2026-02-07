# GitHub 上传指南

## 步骤 1: 在 GitHub 上创建新仓库

1. 登录 GitHub
2. 点击右上角的 "+" 号，选择 "New repository"
3. 填写仓库信息：
   - Repository name: `timeblock-reader`（或您喜欢的名称）
   - Description: `A calendar application for reading and displaying timeblock data from SQLite database files`
   - 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为我们已经有了）
4. 点击 "Create repository"

## 步骤 2: 连接本地仓库到 GitHub

在终端中执行以下命令（将 `YOUR_USERNAME` 替换为您的 GitHub 用户名）：

```bash
cd "c:\Users\sherr\Documents\Github-Yue\timeblock-reader"
git remote add origin https://github.com/YOUR_USERNAME/timeblock-reader.git
```

或者如果您使用 SSH：

```bash
git remote add origin git@github.com:YOUR_USERNAME/timeblock-reader.git
```

## 步骤 3: 推送代码到 GitHub

```bash
git branch -M main
git push -u origin main
```

如果这是您第一次推送，GitHub 可能会要求您输入用户名和密码（或使用 Personal Access Token）。

## 步骤 4: 验证

推送成功后，在浏览器中打开您的 GitHub 仓库页面，应该能看到所有文件都已经上传。

## 后续更新

当您对代码进行修改后，可以使用以下命令更新 GitHub：

```bash
git add .
git commit -m "描述您的更改"
git push
```

## 注意事项

- 确保 `.gitignore` 文件已正确配置，避免上传 `node_modules` 等不必要的文件
- 如果遇到推送错误，请检查网络连接和 GitHub 凭证
- 建议定期提交和推送代码，保持代码的版本控制
