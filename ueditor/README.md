# UEditor 文件下载说明

由于 UEditor 文件较大且 CDN 访问受限，请按以下步骤获取文件：

## 方法一：从 GitHub 下载（推荐）

1. 访问 GitHub 仓库：https://github.com/fex-team/ueditor
2. 点击 "Code" -> "Download ZIP"
3. 解压后，将以下文件复制到 `ueditor/` 目录：
   - `ueditor.all.js` 或 `ueditor.all.min.js`
   - `ueditor.config.js`（已在此目录）
   - `themes/` 文件夹

## 方法二：从百度开发者中心下载

1. 访问：http://ueditor.baidu.com/
2. 下载完整版
3. 复制 `ueditor.all.min.js` 和 `themes/` 到 `ueditor/` 目录

## 方法三：使用已准备的配置

如果您已有 UEditor 文件，只需确保以下文件在正确位置：

```
wxEditor/
├── ueditor/
│   ├── ueditor.config.js      ✓ 已创建
│   ├── ueditor.all.min.js    ✗ 需要下载
│   └── themes/               ✗ 需要复制
│       └── default/
│           └── css/
│               └── ueditor.css
```

## 必需文件清单

| 文件 | 大小 | 说明 |
|------|------|------|
| ueditor.all.min.js | ~500KB | 核心文件，必须 |
| ueditor.config.js | ~3KB | 配置文件，已创建 |
| themes/default/css/ueditor.css | ~50KB | 样式文件，必须 |

## 快速验证

文件放置正确后，打开 index.html 应该能看到完整的 UEditor 编辑器界面。

## 常见问题

**Q: 为什么 CDN 下载失败？**
A: UEditor 的 CDN 分发不够稳定，建议从 GitHub 或百度官网下载完整包。

**Q: 需要下载所有文件吗？**
A: 只需要 `ueditor.all.min.js` 和 `themes/` 目录即可基本运行。

**Q: 编辑器不显示怎么办？**
A: 检查浏览器控制台是否有错误，确保 JS 文件路径正确。
