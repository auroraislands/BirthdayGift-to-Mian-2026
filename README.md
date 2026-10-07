# 给你留了一片小森林

一个 5～10 分钟的横向像素生日散步游戏。给朋友2026年的礼物。

美术素材和音乐素材均为公开免费素材，人物为自设像素画，除本项目请勿使用。

项目代码部分GPT-5.6SOL完成，经由本人调整发布，

## 项目结构

```text
birthday-forest/
├── index.html                  # 游戏页面与 DOM UI
├── style.css                   # 封面、像素对话框、图片画廊、响应式样式
├── game.js                     # Canvas 世界、移动、镜头、互动与剧情
├── README.md
├── assets/
│   ├── audio/
│   │   ├── bgm.mp3            # 已选 CC0 音乐
│   │   └── forest.mp3         # 已选 CC0 森林环境音
│   ├── characters/
│   │   ├── 人物.png           # 用户提供的原图
│   │   ├── friend.png         # 自动处理后的玩家角色
│   │   └── creator.png        # 自动处理后的“我”
│   ├── forest/                # 森林远中近景与地面块
│   ├── props/                 # 木牌、花草、长椅、兔子帧表、路灯
│   ├── gallery/               # 可直接替换的明信片与路灯回忆图
│   ├── vendor/                # 保留的 CC0 原始像素素材表
│   └── licenses/              # 随素材附带的授权说明
├── tools/
│   ├── process_characters.py  # 可重复执行的人物提取脚本
│   └── prepare_art_assets.py  # 可重复生成道具与画廊图片
└── .openai/
    └── hosting.json           # 静态站点部署配置
```

## 人物素材处理

`tools/process_characters.py` 使用了需求中指定的方法：

1. 在原始 `960 × 480` 图片中分别截取左、右角色的宽松区域。
2. 只从裁切区域的四周开始 flood-fill。
3. 仅把与边缘连通的纯黑/近黑背景设为透明。
4. 根据剩余 Alpha 自动紧边裁切，并保留 2 px 透明安全边。

因此人物内部的深色头发、衣服和描边不会因为“删除所有黑色”而丢失。当前输出为：

- `friend.png`：194 × 284 px
- `creator.png`：184 × 274 px

重新处理：

```bash
python tools/process_characters.py
```

## 音乐选择

本项目实际使用以下两项，均为 **CC0 / Public Domain**，网页与个人项目可使用，无强制署名要求：

| 用途 | 曲名 | 作者 | 来源 | License | 署名 |
|---|---|---|---|---|---|
| BGM | JRPG Piano | Joth | [OpenGameArt](https://opengameart.org/content/jrpg-piano) | CC0 | 不需要 |
| 环境音 | Forest Ambience | TinyWorlds | [OpenGameArt](https://opengameart.org/content/forest-ambience) | CC0 | 不需要 |


## 像素美术来源

新增美术均来自 OpenGameArt 的 CC0 / Public Domain 素材，并保留原始图表在 `assets/vendor/`：

| 用途 | 素材 | 作者 | License |
|---|---|---|---|
| 分层森林、地面 | [Forest of Illusion](https://opengameart.org/content/sunnyland-forest-of-illusion) | ansimuz | CC0 |
| 灰兔动画帧 | [Bunny Full Sprite animation tileset](https://opengameart.org/content/bunny-full-sprite-animation-tileset) | Pav Creations | CC0 |
| 牵牛花、彩叶芋基础植物表 | [Flowers](https://opengameart.org/content/flowers) | SpiderDave | CC0 |
| 木牌 | [Tileset Platform Forest](https://opengameart.org/content/tileset-platform-forest) | thekingphoenix | CC0 |
| 长椅 | [City Icons](https://opengameart.org/content/city-icons) | thekingphoenix | CC0 |
| 路灯 | [2D Platformer Side Scroller Stone Fence Street Lamp](https://opengameart.org/content/2d-platformer-side-scroller-stone-fence-street-lamp) | Parriah | CC0 |

`tools/prepare_art_assets.py` 会从这些原始表裁切、重组和调色，生成游戏使用的统一低分辨率 PNG。Canvas 放大时关闭平滑，所以人物、背景和道具会保持相同的硬边像素质感。


