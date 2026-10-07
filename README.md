# 给你留了一片小森林

一个 5～10 分钟的横向像素生日散步游戏。没有战斗、失败、任务栏或键盘操作；点击道路会自动行走，点击沿途物件会走近并打开回忆。

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

对比过但未采用的候选：

| 曲名 | 作者 | 风格与判断 | License |
|---|---|---|---|
| Once Upon a Time (loop) | TAD | 幻想、明亮、管弦感更强；适合结尾，但对整段散步略显戏剧化 | CC0 |
| Peaceful Forest | Samza | 平静弦乐、氛围合适；WAV 体积较大，不利于轻量网页 | CC0 |

最终选 `JRPG Piano` 是因为它短、柔和、带怀旧 JRPG 气质，且 MP3 仅约 500 KB；`Forest Ambience` 本身可无缝循环，约 717 KB。游戏音量默认为音乐 `0.32`、环境音 `0.14`，进入最终区域时音乐短暂提高到 `0.40`。

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

重新生成：

```bash
python tools/prepare_art_assets.py
```

## 素材替换表

| 文件 | 用途 | 建议尺寸 | 当前状态 |
|---|---|---:|---|
| `assets/characters/friend.png` | 玩家角色 | 当前 194 × 284，保持透明 PNG | 已生成并使用 |
| `assets/characters/creator.png` | 结尾角色 | 当前 184 × 274，保持透明 PNG | 已生成并使用 |
| `assets/gallery/postcard-01.png` ～ `postcard-04.png` | 明信片画廊 | 当前 480 × 300；替换时保持 8:5 | 已生成 4 张示例图 |
| `assets/gallery/lantern-memory.png` | 点击路灯后展示 | 当前 480 × 300；替换时保持 8:5 | 已生成示例图 |
| `assets/forest/back.png` | 森林远景 | 低分辨率、可横向平铺 | 已使用分层像素素材 |
| `assets/forest/middle.png` | 森林中景 | 透明低分辨率、可平铺 | 已使用分层像素素材 |
| `assets/forest/foreground.png` | 旧最前景草丛 | 透明低分辨率 | 保留作参考；当前改用无断口的草层 + 岩土纹理地面 |
| `assets/forest/earth-tile.png` | 地面下层岩土纹理 | 64 × 56，横纵重复 | 由同一森林图块的 4 处岩面组合，无透明裁切断口 |
| `assets/props/rabbit-sheet.png` | 灰兔动画 | 3 × 3 帧，每帧 32 × 32 | 第一轮 CC0 兔子调色；只抽取前两行正常帧，第三行“×眼”/受伤/压扁帧全部排除 |
| `assets/props/*.png` | 木牌、花草、长椅、小灯 | 透明低分辨率 PNG | 已生成并使用 |
| `assets/audio/bgm.mp3` | 背景音乐 | 可无缝循环、建议低于 4 MB | 已使用 CC0 成品 |
| `assets/audio/forest.mp3` | 森林环境音 | 可无缝循环、建议低于 3 MB | 已使用 CC0 成品 |

替换明信片或灯光回忆图时，最简单的方式是保持文件名不变直接覆盖。若要增减明信片数量，则编辑 `game.js` 顶部的 `gallerySets.postcard` 数组；路灯图片在 `gallerySets.lantern` 中。

## 修改文案

所有沿途回忆集中在 `game.js` 顶部的 `memories` 数组中。每个条目包含 `id`、位置 `x`、类型、互动距离、访问状态和 `dialogue` 数组。直接修改 `dialogue` 即可，不需要改状态机。

## 本地运行

浏览器的音频与资源加载需要 HTTP，不建议双击 `index.html`。

```bash
cd birthday-forest
python -m http.server 8000
```

打开：<http://localhost:8000>

## GitHub Pages

1. 把 `birthday-forest` 目录内容提交到 GitHub 仓库的默认分支。
2. 在仓库进入 **Settings → Pages**。
3. `Build and deployment` 选择 **Deploy from a branch**。
4. 分支选 `main`，目录选 `/ (root)`，保存。
5. 等待 GitHub 给出 `https://用户名.github.io/仓库名/`。

本项目不依赖后端、构建工具或绝对路径，也可直接拖入 Netlify，或作为静态项目部署到 Vercel。
