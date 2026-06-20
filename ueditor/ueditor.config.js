// UEditor 配置文件
window.UEDITOR_HOME_URL = './ueditor/';
window.UEDITOR_CONFIG = {
    // 编辑器容器ID
    textarea: 'editor',
    
    // 服务器端请求地址 - 留空禁用上传功能
    serverUrl: '',
    
    // 工具栏配置 - 完整功能
    toolbars: [
        ['fullscreen', 'source', '|', 'undo', 'redo', '|',
         'bold', 'italic', 'underline', 'strikethrough', 'forecolor', 'backcolor', '|',
         'justifyleft', 'justifycenter', 'justifyright', 'justifyjustify', '|',
         'link', 'unlink', '|', 'insertimage', 'insertvideo', 'emotion', '|',
         'inserttable', 'deletetable', '|', 'rowspacingtop', 'rowspacingbottom', '|',
         'lineheight', '|', 'paragraph', 'fontfamily', 'fontsize', '|',
         'indent', '|', 'selectall', 'cleardoc', '|', 'print', 'preview']
    ],
    
    // 默认高度
    initialFrameHeight: 500,
    
    // 启用自动高度
    autoHeightEnabled: true,
    
    // 启用字数统计
    enableAutoSave: false,
    
    // 启用自动保存
    saveInterval: 5000,
    
    // 默认宽度
    initialFrameWidth: '100%',
    
    // 启用拉伸
    autoFloatEnabled: true,
    
    // 主题
    theme: 'default',
    
    // 主题配置
    themePath: './ueditor/themes/',

    // iframe 编辑区内容自定义样式（防止采集内容溢出）
    iframeCssUrl: './ueditor/ueditor-content.css',
    
    // 语言
    lang: 'zh-cn',
    
    // 上传图片配置
    imageActionName: 'uploadimage',
    imageFieldName: 'upfile',
    imageMaxSize: 2048000,
    imageAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    
    // 上传视频配置
    videoActionName: 'uploadvideo',
    videoFieldName: 'upfile',
    videoMaxSize: 102400000,
    videoAllowFiles: ['.flv', '.swf', '.mkv', '.avi', '.rm', '.rmvb', '.mpeg', '.mpg', '.ogg', '.ogv', '.mov', '.wmv', '.mp4', '.webm', '.mp3', '.wav', '.mid'],
    
    // 上传文件配置
    fileActionName: 'uploadfile',
    fileFieldName: 'upfile',
    fileMaxSize: 51200000,
    fileAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.flv', '.swf', '.mkv', '.avi', '.rm', '.rmvb', '.mpeg', '.mpg', '.ogg', '.ogv', '.mov', '.wmv', '.mp4', '.webm', '.mp3', '.wav', '.mid', '.rar', '.zip', '.tar', '.gz', '.7z', '.bzip2', '.gif', '.pdf', '.js', '.css', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.pdf', '.jpg', '.png'],
    
    // 图片在线管理
    imageManagerActionName: 'listimage',
    imageManagerAllowFiles: ['.png', '.jpg', '.jpeg', '.gif', '.bmp'],
    imageManagerManagerWidth: '100%',
    imageManagerManagerHeight: '100%',
    
    // 表情
    emotionLocalization: true,
    
    // 代码语言 (禁用，因缺少第三方库)
    codeMirrorJsUrl: '',
    codeMirrorCssUrl: '',
    
    // 自动保存
    enableContextMenu: true,
    
    // 快捷菜单
    contextMenu: [
        {'label': '剪切', 'cmd': 'cut'},
        {'label': '复制', 'cmd': 'copy'},
        {'label': '粘贴', 'cmd': 'paste'}
    ],
    
    // 粘贴配置
    pasteplain: false,
    
    // 禁用样式过滤，保留完整的HTML样式 - 微信公众号采集专用配置
    filterTxtRules: function(){
        return {};
    },
    
    // 保留所有HTML标签和属性，不做任何转换
    allowDivTransToP: false,
    retainOnlyLabelPasted: false,
    pasteFilter: false,
    
    // 允许所有标签，不删除任何标签
    isShow: true,
    
    // 禁用自动段落转换，保持原始HTML结构
    autoClearEmptyNode: false,
    
    // 允许所有iframe等特殊标签
    xssFilterRules: false,
    
    // 图片处理配置 - 保持原始大小，不做自动缩放
    imageScaleEnabled: true,
    imagePopup: true,
    
    // 字体
    fontfamily: [
        {'label': '宋体', 'name': 'songti', 'vals': ['SimSun']},
        {'label': '仿宋', 'name': 'fangsong', 'vals': ['FangSong']},
        {'label': '黑体', 'name': 'heiti', 'vals': ['SimHei']},
        {'label': '微软雅黑', 'name': 'microsoftyahei', 'vals': ['Microsoft YaHei']},
        {'label': '楷体', 'name': 'kaiti', 'vals': ['KaiTi']},
        {'label': 'Arial', 'name': 'Arial', 'vals': ['Arial']},
        {'label': 'Times New Roman', 'name': 'times new roman', 'vals': ['Times New Roman']},
        {'label': 'Courier New', 'name': 'courier new', 'vals': ['Courier New']}
    ],
    
    // 字号
    fontsize: [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72],
    
    // 行间距
    lineheight: ['1', '1.5', '1.75', '2', '2.5', '3']
};
