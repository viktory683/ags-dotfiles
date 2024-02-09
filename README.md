### Info
version: `0.1.1`

### TODO
- [/] Стили
- [/] Модули
    - [x] Workspaces
    - [x] Scratchpad
    - [x] Mode
    - [/] Mpris
        - [ ] обрезать длину текста
        - [ ] Окно по тексту
        - [ ] Багулю отловить, что статус плеера неизвестен
    - [ ] Clock
        - [x] Clock itself
        - [ ] Calendar
    - [ ] Tray
    - [ ] runcat
    - [ ] touchpad
    - [x] language
    - [x] temperature
    - [x] cpu
    - [x] memory
    - [x] backlight
    - [x] pulse
    - [x] network
    - [-] battery
- [ ] Hover bug
    Странно фиксируются события hover и hoverlost
    При использовани `on_hover` и `on_hover_lost` ломается `:hover` в CSS. Будем менять концепт дизайна основывааясь на кликах и мб взаимодействии клавой вместо ховеров
- [ ] На старте необходимо запускать проверку на дурака
    - [ ] Существуют ли в системе скрипты запускаемые с `exec` или `execAsync`
