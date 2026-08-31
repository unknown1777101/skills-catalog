# Roblox Alert Indicator & Badge System Guide & Reference

This reference document provides architecture patterns and concrete Luau code templates for creating a centralized, reactive **Alert Indicator (Red-Dot / Badge Counter)** system across UI menus, buttons, and navigation tabs.

---

## 1. Why a Centralized Indicator System?

In complex Roblox games with multiple features (Inventory, Quests, Shop, Daily Rewards, Battle Pass):
- Writing custom `if hasUnread then redDot.Visible = true end` logic scattered across dozens of individual UI scripts leads to desynchronization, stale notification dots, and high maintenance debt.
- **Centralized Indicator Architecture** solves this:
  - **Domain**: Pure rules for calculating whether an alert condition is met (e.g. `HasUnclaimedReward`, `UnreadMailCount`).
  - **Controller / State**: Central `IndicatorController` that holds reactive indicators by semantic keys (e.g. `"Shop.FreeDaily"`, `"Quests.Ready"`).
  - **Presentation**: Reusable `IndicatorBadgePresenter` attached to any UI button that automatically reacts to state updates, bounces with tweening, and cleans up with `Trove`.

---

## 2. Directory Structure

```text
src/
├── shared/
│   └── Domain/
│       └── Indicators/
│           └── IndicatorKeys.lua (Semantic key registry)
│
├── client/
    ├── Controllers/
    │   └── IndicatorController.lua (Central client state registry for indicators)
    └── Presentation/
        └── Indicators/
            ├── IndicatorBadgeView.lua (UI layout for red dot / counter)
            └── IndicatorBadgePresenter.lua (Reactive binding, tween & Trove)
```

---

## 3. Implementation Code Examples

### A. IndicatorKeys (Domain)
```lua
-- src/shared/Domain/Indicators/IndicatorKeys.lua
local IndicatorKeys = {
    DailyReward_Claimable = "DailyReward.Claimable",
    Inventory_NewItem = "Inventory.NewItem",
    Quests_ReadyToClaim = "Quests.ReadyToClaim",
    BattlePass_RewardAvailable = "BattlePass.RewardAvailable",
    Shop_FreeItem = "Shop.FreeItem",
}

return table.freeze(IndicatorKeys)
```

---

### B. IndicatorController (Client State Registry)
```lua
-- src/client/Controllers/IndicatorController.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Knit = require(ReplicatedStorage.Packages.Knit)
local Signal = require(ReplicatedStorage.Packages.Signal)

local IndicatorController = Knit.CreateController({
    Name = "IndicatorController",
})

function IndicatorController:KnitInit()
    self._indicators = {} -- [key: string] = number | boolean
    self.IndicatorChanged = Signal.new() -- (key: string, value: number | boolean)
end

function IndicatorController:SetIndicator(key: string, value: number | boolean)
    if self._indicators[key] == value then
        return
    end

    self._indicators[key] = value
    self.IndicatorChanged:Fire(key, value)
end

function IndicatorController:GetIndicator(key: string): number | boolean
    return self._indicators[key] or false
end

function IndicatorController:ClearIndicator(key: string)
    self:SetIndicator(key, false)
end

return IndicatorController
```

---

### C. IndicatorBadgePresenter (Presentation with Trove & Tween)
```lua
-- src/client/Presentation/Indicators/IndicatorBadgePresenter.lua
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Trove = require(ReplicatedStorage.Packages.Trove)
local Knit = require(ReplicatedStorage.Packages.Knit)

local IndicatorBadgePresenter = {}
IndicatorBadgePresenter.__index = IndicatorBadgePresenter

function IndicatorBadgePresenter.new(targetButton: GuiButton, indicatorKey: string, customBadgeTemplate: GuiObject?)
    local self = setmetatable({
        _target = targetButton,
        _key = indicatorKey,
        _trove = Trove.new(),
    }, IndicatorBadgePresenter)

    -- 1. Create or mount Badge Instance
    local badge = customBadgeTemplate and customBadgeTemplate:Clone() or self:_createDefaultBadge()
    badge.Parent = targetButton
    badge.Visible = false
    self._badge = badge
    self._trove:Add(badge)

    -- 2. Connect to Central Indicator Controller
    local indicatorController = Knit.GetController("IndicatorController")
    self._trove:Add(indicatorController.IndicatorChanged:Connect(function(key, value)
        if key == self._key then
            self:_updateVisual(value)
        end
    end))

    -- Initialize current state
    self:_updateVisual(indicatorController:GetIndicator(self._key))

    return self
end

function IndicatorBadgePresenter:_createDefaultBadge(): Frame
    local badge = Instance.new("Frame")
    badge.Name = "IndicatorDot"
    badge.Size = UDim2.new(0, 14, 0, 14)
    badge.Position = UDim2.new(1, -6, 0, -6)
    badge.AnchorPoint = Vector2.new(0.5, 0.5)
    badge.BackgroundColor3 = Color3.fromRGB(255, 60, 60)
    badge.BorderSizePixel = 0

    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(1, 0)
    corner.Parent = badge

    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(255, 255, 255)
    stroke.Thickness = 1.5
    stroke.Parent = badge

    return badge
end

function IndicatorBadgePresenter:_updateVisual(value: number | boolean)
    local isVisible = false
    if type(value) == "number" then
        isVisible = value > 0
    elseif type(value) == "boolean" then
        isVisible = value
    end

    if isVisible and not self._badge.Visible then
        self._badge.Visible = true
        self._badge.Size = UDim2.new(0, 0, 0, 0)

        -- Pop bounce animation
        local tween = TweenService:Create(self._badge, TweenInfo.new(0.3, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
            Size = UDim2.new(0, 14, 0, 14),
        })
        self._trove:Add(tween)
        tween:Play()
    elseif not isVisible then
        self._badge.Visible = false
    end
end

function IndicatorBadgePresenter:Destroy()
    self._trove:Clean()
end

return IndicatorBadgePresenter
```

---

## 4. Best Practices
1. **Semantic Keys Only**: Always register keys in `IndicatorKeys.lua` to avoid typos.
2. **One Badge Per Feature Key**: Multiple UI buttons can observe the same key (e.g. Topbar Shop Button and In-Game Shop Tab can both listen to `"Shop.FreeItem"`).
3. **Clean Up on Button Destroy**: Attach `IndicatorBadgePresenter` to the button's or window's `Trove`.
