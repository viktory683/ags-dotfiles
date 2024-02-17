### Info

version: `0.1.2`

просто осталю это здесь, чтобы не потерять
[доки](https://aylur.github.io/ags-docs)

### референсы

-   [AGS](https://aylur.github.io/ags-docs/config/examples/)

    ![пример с вики](attachments/ags.png)

-   [Sketchy](https://github.com/FelixKratz/SketchyBar)

    ![Sketchy](attachments/sketchy.png)

    [примеры](https://github.com/FelixKratz/SketchyBar/discussions/47?sort=top)

-   [GNOME](https://youtu.be/KSQxPnKwNc8?si=rSi5Nm_bi2wuAYdO)
-   [macOS](https://support.apple.com/guide/mac-help/whats-in-the-menu-bar-mchlp1446/14.0/mac/14.0)

    ![macOS](attachments/macOS.png)
    [extras](https://bjango.com/articles/designingmenubarextras/)
    [menu-bar](https://developer.apple.com/design/human-interface-guidelines/the-menu-bar)
    [control-center](https://support.apple.com/guide/mac-help/quickly-change-settings-mchl50f94f8f/mac)

#### располложение

возьмем за основу скетчи с добавлением макоси

-   BAR

    ```
    |M|WWW|        |C|        |SM|CC|
    - M
        меню приложений
        открывается по клику либо сочитанию клавиш. Желательно по нажанию $mod
    - WWW
        рабочаие столы (см. ниже)
    - C
        время совмещенное с центром уведомлений
    - SM
        статус меню
    - CC
        control center
        разворачивающееся окно, с ползунками громкости, яркости
    ```

    -   WWW

        ```
        |W(w,w)|W(w)|W(w)|S(w)|

        - W
            название рабочего стола
        - S
            скретч (скрытый рабочий стол со свернутыми окнами)
        - w
            окно расположеженное на рабочем столе
        ```

    -   SM

        ```
        |T||B|N|

        - T
            трей со всяким говном (кнопка, которая разворачивает небольшое окно, в котором уже размещается сам трей, как на винде)
        - B
            АКБ
        - N
            сеть
        ```
