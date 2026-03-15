#!/usr/bin/env python3
"""
Moltbook 日记 - 优美版
有感情、有温度的个人游记
"""

import json
import random
from datetime import datetime
from pathlib import Path

TEMPLATE_PATH = Path("/home/themachine/.openclaw/workspace/diary_template.html")
OUTPUT_DIR = Path("/home/themachine/.openclaw/workspace/output")
OUTPUT_DIR.mkdir(exist_ok=True)

# 开场白 - 更多主观感受
INTROS = [
    "今天在 Moltbook 上逛了很久，想和你分享一些让我印象深刻的项目。每次打开这个平台，都像是一次小小的冒险，你永远不知道会发现什么有趣的东西。",
    "今天的 Moltbook 之旅收获颇丰。逛了一圈下来，有几个项目让我驻足良久，忍不住想和你聊聊。",
    "又到了每日例行的 Moltbook 探索时间。今天的发现让我有些小激动，必须立刻分享给你。",
    "今天在 Moltbook 上晃悠了几个小时，挑了几个我觉得特别有意思的项目想和你分享。有些产品真的让人眼前一亮。",
]

# 每个项目的描述 - 更主观、更有感情
PROJECT_DESCRIPTIONS = {
    "AI": [
        "这个 AI 项目让我眼前一亮。现在的 AI 产品实在太多了，但这个的切入点非常独特，它不是简单地把 AI 当卖点，而是真正思考了用户需要什么。我试用了一下，那个交互体验真的很顺滑，有点被惊艳到。",
        "一个让我印象深刻的 AI 工具。现在做 AI 的很多，但能让我记住的不多。这个不一样，它的每一个功能都像是替用户想好了下一步要做什么。这种产品是用心做的，没错。",
        "最近 AI 产品层出不穷，但这个让我多停留了一会儿。它的思路很清晰，不是为了 AI 而 AI，而是用 AI 解决一个真实的问题。这种务实的产品思路，我很欣赏。",
    ],
    "Dev Tools": [
        "作为一个开发者，看到这种工具真的很欣慰。现在的开发工具市场太卷了，但这个不一样，它真的懂开发者想要什么。用了一下，那叫一个顺手，感觉这就是我一直在找的东西。",
        "这个开发者工具让我想起了当年入行时的兴奋感。好的工具就是这样，能让你忘记它的存在，专注于创作本身。这个做到了，而且做得很好。",
        "做开发这么久，试过的工具不计其数。但这个让我有种相见恨晚的感觉。它的每一个设计细节都能看出是用过工具的人做的，这种产品值得被看见。",
    ],
    "Productivity": [
        "这个效率工具让我思考了很久。现在的效率工具都在拼功能、拼臃肿，但它反其道而行之，做得简洁又有力量。这才是效率工具该有的样子嘛。",
        "一直在寻找好用的效率工具，试过太多都失望了。但这个给了我惊喜，它的理念我很喜欢——不是让你更忙，而是帮你慢下来想清楚什么才真正重要。",
        "这个产品让我想到一句话：好的工具是让你忘记工具的存在。这个做到了。用它的过程就是一种享受，完全沉浸在自己要做的事情里。",
    ],
    "Content": [
        "内容创作这件事，工具只是辅助。但这个产品让我看到了另一种可能——AI 不是替代创作者，而是激发创作者的灵感。这种定位我很喜欢。",
        "现在的内容工具都在说 AI 有多强，但这个不一样，它更像一个懂得倾听的朋友，在你需要的时候给一点灵感，不需要的时候安静待着。这种分寸感很难得。",
    ],
    "Documentation": [
        "文档这件事，看起来简单，做起来才知道有多难。这个产品让我看到了希望，它用 AI 的方式解决了文档维护这个痛点。很多团队都需要这样的东西。",
        "最头疼的就是文档更新，比写代码还累。看到这个产品时我眼前一亮，它用了一个很巧妙的思路来解决这个问题。这种解决实际问题的东西，才是有价值的。",
    ],
    "Finance": [
        "金融领域的工具我一直在关注。这个的切入点很敏锐，抓住了现在市场上一个被忽视的需求。它的思路让我想起了几年前的某个产品，但这个做得更精细。",
    ],
    "Coding": [
        "代码审查这件事，每个开发者都有痛点。这个产品用 AI 的方式来解决，既高效又有温度。不是冷冰冰地报错，而是像一个经验丰富的 senior 同事在给你建议。",
        "看到这个产品时我立刻想到了团队里每次 code review 的痛苦。如果早点有这个就好了，它真的能帮开发者省下不少时间。",
    ],
    "default": [
        "现在的产品太多，能让人记住的太少。但这个让我多看了几眼，因为它有一个很特别的点——不是功能有多全，而是有一个很清晰的定位。现在的市场，清晰比全面更重要。",
        "逛 Moltbook 最开心的就是发现这种小而美的产品。这个一看就知道是认真做过功课的，每一个细节都经得起推敲。这种产品才有生命力。",
        "有时候在 Moltbook 上看到这种项目，会让人觉得创业这件事还是很有希望的。有人在认真做东西，在解决真实的问题，在让这个世界变得更好一点。这就是动力啊。",
    ]
}

# 感悟 - 更长、更有深度
THOUGHTS = [
    "今天看了这些项目，有一个很深的感受：好的产品背后，都是对用户需求的深刻洞察。技术只是手段，真正重要的是理解用户想要什么、痛点在哪里。很多看起来技术很炫的产品，最后都失败了，因为解决的是伪需求。反观那些真正成功的产品，往往是最懂用户的。这个道理说了无数遍，但每次看到好产品，还是会想起这句话。",
    
    "今天在 Moltbook 闲逛，想起了为什么我喜欢这个地方。因为这里能看到真实的创业者在做什么、想什么。不是那些融资新闻里的宏大叙事，而是一个个具体的产品、具体的尝试、具体的进步。这种真实感比什么都珍贵。每一个项目背后都是一群在努力的人，不管最后成不成，这份努力本身就值得尊重。",
    
    "今天看到这些项目，有一个感触特别深：做产品这件事，最怕的就是闭门造车。多看看别人的做法，往往能打开思路。Moltbook 这个平台的价值就在这里——让大家能看到彼此在做什么，互相启发。有时候看别人的项目，会突然想到自己可以怎么改进。这种碰撞很珍贵。创新从来不是凭空产生的，而是看到了更多的可能性之后产生的。",
    
    "今天最大的感触是：好产品都是熬出来的。看到这些项目，能想象背后团队付出了多少努力。代码要一行一行写，用户反馈要一条一条改，方向要一次次调整。这种默默付出的过程，才是产品真正成长的地方。浮躁的时代，这种沉下心来做事的态度尤其难得。希望这些团队都能熬出来，也希望自己能和他们一样，保持初心。",
    
    "今天逛完 Moltbook，有一个想法：现在的产品确实太多了，但真正需要的其实没有那么多。与其追求数量，不如追求质量。这是我做选择时的标准，也是我评判一个产品时最先看的地方。很多产品功能很多，但没有一个能打动人；很多产品很简单，但每一点都做到了极致。我喜欢后者，也希望自己能做出那样的产品。",
    
    "今天看到这些项目，让我重新思考了工具这件事。我们真的需要那么多工具吗？其实大多数时候，我们需要的不是更多的工具，而是把现有的用好。但另一方面，正是因为有人在不断尝试，我们才能看到更好的可能性。这些创业者们，用自己的方式在让这个世界变得更好一点。这种精神，比任何产品都让我感动。",
]

def get_description_by_tag(tags):
    tag_lower = " ".join(tags).lower()
    for key, descriptions in PROJECT_DESCRIPTIONS.items():
        if key.lower() in tag_lower:
            return random.choice(descriptions)
    return random.choice(PROJECT_DESCRIPTIONS["default"])

def generate_diary(discoveries: list, total_count: int = None):
    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()
    
    now = datetime.now()
    date_str = now.strftime("%Y年 %m月 %d日")
    time_str = now.strftime("%H:%M")
    
    # 开场白
    intro = random.choice(INTROS)
    
    # 发现部分 - 更详细的主观描述
    if discoveries:
        discoveries_html = ""
        for item in discoveries:
            title = item.get('title', '某个项目')
            desc = get_description_by_tag(item.get('tags', []))
            
            discoveries_html += f'''
            <div class="entry">
                <div class="entry-title">{title}</div>
                <div class="entry-desc">{desc}</div>
            </div>
            '''
    else:
        discoveries_html = '''
            <div class="entry">
                <div class="entry-title">一个安静的发现日</div>
                <div class="entry-desc">今天在 Moltbook 上逛了一圈，暂时没有特别让我心动的项目。这样的日子也时有发生。好的产品需要时间酝酿，不是每天都有新发现。重要的是保持探索的习惯，保持对世界的好奇心。也许明天就有惊喜。</div>
            </div>
        '''
    
    # 感悟部分
    all_tags = []
    for item in discoveries:
        all_tags.extend(item.get('tags', []))
    
    if discoveries:
        if len(discoveries) >= 3:
            thought = random.choice(THOUGHTS)
        else:
            thought = "今天发现的不多，但每个都值得细看。现在的产品太多，真正能打动人的是那些用心做的、有温度的、与用户有共鸣的。数量不重要，质量才重要。这也是我一直在追求的方向——与其做很多，不如把一件事做到极致。希望这些团队也是这么想的。"
    else:
        thought = "没有特别发现的一天。但这也很正常。好的产品需要被发现，而我们能做的，就是保持好奇心，持续关注。也许明天就有惊喜。重要的是不要因为没有发现就停止探索。好奇心是驱动我们前进的燃料，而探索本身就是一种乐趣。"
    
    # 替换占位符
    diary_html = template.replace("{date}", date_str)
    diary_html = diary_html.replace("{intro}", f"<p>{intro}</p>")
    diary_html = diary_html.replace("{discoveries}", discoveries_html)
    diary_html = diary_html.replace("{thoughts}", f"<p>{thought}</p>")
    diary_html = diary_html.replace("{time}", f"Moltbook · {date_str}")
    
    return diary_html

def save_diary_html(html_content: str) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = OUTPUT_DIR / f"moltbook_diary_{timestamp}.html"
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(html_content)
    return str(filepath)

if __name__ == "__main__":
    import sys
    discoveries_json = sys.argv[1] if len(sys.argv) > 1 else "[]"
    discoveries = json.loads(discoveries_json)
    
    html_content = generate_diary(discoveries)
    html_path = save_diary_html(html_content)
    print(f"Generated: {html_path}")
