# Roblox Responsive UI & MVP Presenter Guide & Reference

This reference document provides concrete architecture templates and code examples for building responsive, cross-platform User Interfaces (Desktop, Mobile, Tablet, Console) in Roblox using the Model-View-Presenter (MVP) pattern and dynamic `UIScale` calculations.

---

## 1. Core Principles: MVP in Roblox

```text
  [ User Interaction ]
           │
           ▼
     [ View.lua ] (Pure UI elements, layout, buttons, BillboardGuis)
           │
           ▼ (Event Forwarding via Signals)
  [ Presenter.lua ] (State formatting, Tween animations, Trove cleanup)
           │
           ▼ (Action Dispatches)
 [ Controller.lua ] (Client network gateway / UseCases)
```

1. **View**: Pure layout and UI hierarchy. Contains zero game rules, zero network calls, and minimal logic. Exposes signals for user actions (e.g. `self.OnButtonClicked`).
2. **Presenter**: Listens to View events, drives tween animations, formats data for display, and binds lifecycle to `Trove`.
3. **Controller**: Handles server communication and passes game data down to the Presenter.

---

## 2. Dynamic UIScale Helper (Responsive Scaling)

```lua
-- src/client/Presentation/UI/Common/ResponsiveScaleHelper.lua
local ResponsiveScaleHelper = {}

-- Base reference resolution: 1280x720 (16:9 standard mobile/desktop baseline)
local BASE_VIEWPORT_Y = 720
local MIN_SCALE = 0.65
local MAX_SCALE = 1.15

function ResponsiveScaleHelper.AttachResponsiveScale(screenGui: ScreenGui, customMin: number?, customMax: number?): UIScale
    local uiScale = screenGui:FindFirstChildOfClass("UIScale")
    if not uiScale then
        uiScale = Instance.new("UIScale")
        uiScale.Parent = screenGui
    end

    local min = customMin or MIN_SCALE
    local max = customMax or MAX_SCALE

    local camera = workspace.CurrentCamera
    local function updateScale()
        if not camera then return end
        local viewportSize = camera.ViewportSize
        if viewportSize.Y <= 0 then return end

        local scaleFactor = viewportSize.Y / BASE_VIEWPORT_Y
        uiScale.Scale = math.clamp(scaleFactor, min, max)
    end

    updateScale()
    camera:GetPropertyChangedSignal("ViewportSize"):Connect(updateScale)

    return uiScale
end

return ResponsiveScaleHelper
```

---

## 3. Concrete MVP Implementation Example

### A. View (Layout & Event Source)
```lua
-- src/client/Presentation/Inventory/InventoryView.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Signal = require(ReplicatedStorage.Packages.Signal)

local InventoryView = {}
InventoryView.__index = InventoryView

function InventoryView.new(guiInstance: ScreenGui)
    local self = setmetatable({
        _gui = guiInstance,
        _mainFrame = guiInstance:WaitForChild("MainFrame"),
        _closeButton = guiInstance.MainFrame:WaitForChild("CloseButton"),
        _itemGrid = guiInstance.MainFrame:WaitForChild("ItemGrid"),
        CloseClicked = Signal.new(),
        ItemClicked = Signal.new(),
    }, InventoryView)

    self._closeButton.MouseButton1Click:Connect(function()
        self.CloseClicked:Fire()
    end)

    return self
end

function InventoryView:SetVisible(visible: boolean)
    self._mainFrame.Visible = visible
end

function InventoryView:GetGui(): ScreenGui
    return self._gui
end

return InventoryView
```

---

### B. Presenter (Lifecycle, Animations, Trove)
```lua
-- src/client/Presentation/Inventory/InventoryPresenter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Trove = require(ReplicatedStorage.Packages.Trove)
local ResponsiveScaleHelper = require(
    script.Parent.Parent.UI.Common.ResponsiveScaleHelper
)

local InventoryPresenter = {}
InventoryPresenter.__index = InventoryPresenter

function InventoryPresenter.new(view, inventoryController)
    local self = setmetatable({
        _view = view,
        _controller = inventoryController,
        _trove = Trove.new(),
    }, InventoryPresenter)

    -- Attach dynamic responsive scaling
    ResponsiveScaleHelper.AttachResponsiveScale(self._view:GetGui())

    -- Wire View Events
    self._trove:Add(self._view.CloseClicked:Connect(function()
        self:Hide()
    end))

    return self
end

function InventoryPresenter:Show(items: { any })
    self._view:SetVisible(true)

    -- Animate popup
    local frame = self._view._mainFrame
    frame.Position = UDim2.new(0.5, 0, 0.6, 0)
    frame.BackgroundTransparency = 1

    local tween = TweenService:Create(frame, TweenInfo.new(0.25, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
        Position = UDim2.new(0.5, 0, 0.5, 0),
        BackgroundTransparency = 0,
    })
    self._trove:Add(tween)
    tween:Play()
end

function InventoryPresenter:Hide()
    self._view:SetVisible(false)
end

function InventoryPresenter:Destroy()
    self._trove:Clean()
end

return InventoryPresenter
```

---

## 4. Best Practices
1. **Never Hardcode Pixels for Screen Bounds**: Use proportional scale (`{Scale, Offset}`) or `UIScale` modifiers.
2. **Touch-Friendly Buttons**: Minimum interactive element tap target is **44×44 pixels** on mobile.
3. **No Direct Remote Calls in View**: Views must only fire local events (`Signal`), leaving business logic to Controllers.
