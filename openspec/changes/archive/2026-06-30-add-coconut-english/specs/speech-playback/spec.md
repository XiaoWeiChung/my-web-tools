## ADDED Requirements

### Requirement: 英文语音朗读
系统 SHALL 使用浏览器原生 Web Speech API（`speechSynthesis`）朗读英文文本，并优先选择英文（en-US 或 en）语音、使用适合幼儿的较慢语速。

#### Scenario: 朗读单词
- **WHEN** 应用请求朗读一个英文单词或字母
- **THEN** 系统以英文语音、较慢语速朗读该文本

#### Scenario: 连续朗读
- **WHEN** 在前一段语音尚未结束时请求新的朗读
- **THEN** 系统取消正在进行的朗读并立即开始新的朗读，避免语音排队堆叠

### Requirement: 全局声音开关
系统 SHALL 提供一个全局声音开关控件，孩子或家长可随时开启或关闭所有语音与音效，且关闭状态下视觉反馈仍正常工作。

#### Scenario: 切换声音开关
- **WHEN** 用户点击声音开关按钮
- **THEN** 系统在开启与关闭状态间切换，并更新按钮图标以反映当前状态

#### Scenario: 关闭状态下不发声
- **WHEN** 声音处于关闭状态且发生任意需要发声的交互
- **THEN** 系统不播放任何语音或音效

### Requirement: 语音不可用时的降级
系统 SHALL 在浏览器不支持 `speechSynthesis` 时优雅降级，保证视觉内容与交互仍可正常使用。

#### Scenario: 浏览器不支持语音
- **WHEN** 运行环境不支持 Web Speech API
- **THEN** 系统跳过语音播放，不报错，所有图片、卡片与游戏交互继续可用
