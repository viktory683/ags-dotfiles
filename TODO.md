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
- [ ] Нужна дев и мастер ветки, чтобы при перезагрузке ничего не померло от криворукости и незаконченности
- [ ] Определение рабочего окружения (или параметр в конфиге)
- [ ] Hooks update maybe
- [ ] urgent для воркспейсов
- [ ] скретч
- [ ] избавиться от кучи повторяющихся кусков кода типо shouldReveal-revealObj-updateObjClasses (наеюсь получится от этого полноценно избавиться, когда будем переделывать виджеты с ховера на клики)

### In Progress

- [ ] рефактор

### Done ✓

- [ ] Модули
    - [x] Workspaces
    - [x] Scratchpad
    - [x] Mode
    - [ ] Clock
        - [x] Clock itself
    - [x] language
    - [x] temperature
    - [x] CPU
        - [x] использовать для чтения потоковый парсер `mpstat-s`
            Почему-то потоковый парсер страдает херней. работает, но пролагивает. Возвращаемся к дефолту
    - [x] memory
    - [x] backlight
    - [x] pulse
    - [x] network
    - [x] battery
- [x] Избавиться от бесчисленного колличества `// @ts-ignore`
    ags обновлися до новой версии, поэтому `bind` теперь ожидает в качестве аттрибута литерал `attribute`
