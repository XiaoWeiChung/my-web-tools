## ADDED Requirements

### Requirement: 字母卡展示
系统 SHALL 展示 A 到 Z 共 26 个字母卡，每张卡含大写字母、小写字母、一个代表性单词及其图标（如 A - Apple 🍎）。

#### Scenario: 进入字母 ABC
- **WHEN** 孩子在首页点击"字母 ABC"
- **THEN** 系统按 A-Z 顺序显示全部 26 张字母卡

### Requirement: 字母点击发音
系统 SHALL 在孩子点击字母卡时朗读该字母的英文读音及其代表单词。

#### Scenario: 点击字母卡
- **WHEN** 孩子点击字母卡 "A"
- **THEN** 系统朗读字母名称及代表单词（如 "A, Apple"），并对卡片播放视觉反馈

#### Scenario: 声音关闭时点击字母
- **WHEN** 全局声音处于关闭状态且孩子点击字母卡
- **THEN** 系统仅播放视觉反馈，不发声
