# 

### Todo

- [ ] Стили
- [ ] Модули
    - [ ] Clock
        - [ ] Calendar
    - [ ] Tray
    - [ ] runcat
    - [ ] touchpad
- [ ] Hover bug

    Странно фиксируются события hover и hoverlost

    При использовани `on_hover` и `on_hover_lost` ломается `:hover` в CSS. Будем менять концепт дизайна основывааясь на кликах и мб взаимодействии клавой вместо ховеров

- [ ] На старте необходимо запускать проверку на дурака
    - [ ] Существуют ли в системе скрипты запускаемые с `exec` или `execAsync`
- [ ] Парсить текущую гтк тему на предмет цветов и подобное (темная тема к примеру)
  
### In Progress

- [ ] Избавиться от бесчисленного колличества `// @ts-ignore`
    ags обновлися до новой версии, поэтому bind теперь ожидает в качестве аттрибута литерал `attribute`

### Done ✓

- [ ] Модули
    - [x] Workspaces
    - [x] Scratchpad
    - [x] Mode
    - [ ] Clock
        - [x] Clock itself
    - [x] language
    - [x] temperature
    - [x] cpu
    - [x] memory
    - [x] backlight
    - [x] pulse
    - [x] network
    - [x] battery