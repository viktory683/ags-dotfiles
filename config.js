import Widget from "resource:///com/github/Aylur/ags/widget.js";

function Bar(monitor = 0) {
    const label = Widget.Label({
        label: "some example stuff"
    })

    const win = Widget.Window({
        monitor,
        name: "bar${monitor}",
        anchor: ["top", "left", "right"],
        child: label
    })

    return
}

export default { windows: [Bar()] }