--!strict
--- UI Helper utility for drawing and updating red-dot indicators and numeric count badges.
-- @module UIBadgeHelper
local UIBadgeHelper = {}

local BADGE_RED = Color3.fromRGB(239, 68, 68)
local BADGE_TEXT_COLOR = Color3.fromRGB(255, 255, 255)

--- Helper to style GuiObjects like CSS
local function applyStyle(instance: Instance, style: {[string]: any})
    for property, value in pairs(style) do
        (instance :: any)[property] = value
    end
end

--- @function setDot
--- @brief Adds or removes a red-dot indicator to a parent UI button/frame.
--- @param parent GuiObject The UI button or frame to attach the indicator to.
--- @param visible boolean Whether the indicator should be displayed.
--- @param positionOverride UDim2? Optional custom position.
--- @param anchorOverride Vector2? Optional custom anchor point.
function UIBadgeHelper.setDot(parent: GuiObject, visible: boolean, positionOverride: UDim2?, anchorOverride: Vector2?)
    local existing = parent:FindFirstChild("IndicatorDot")
    
    if not visible then
        if existing then
            existing:Destroy()
        end
        return
    end
    
    if existing then return end
    
    local selectedPos = positionOverride or UDim2.new(1, -6, 0, 6) -- Slightly inward to avoid clipping
    local selectedAnchor = anchorOverride or Vector2.new(0.5, 0.5)
    
    local dot = Instance.new("Frame")
    dot.Name = "IndicatorDot"
    dot.ZIndex = parent.ZIndex + 5
    applyStyle(dot, {
        Size = UDim2.new(0, 10, 0, 10),
        Position = selectedPos,
        AnchorPoint = selectedAnchor,
        BackgroundColor3 = BADGE_RED,
        BorderSizePixel = 0
    })
    dot.Parent = parent
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0.5, 0) -- Circular shape
    corner.Parent = dot
    
    -- Subtly add a small UIStroke for contrast/border
    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(25, 25, 25)
    stroke.Thickness = 1.2
    stroke.Parent = dot
end

--- @function setBadgeCount
--- @brief Adds, updates, or removes a numeric count badge on a parent UI button/frame.
--- @param parent GuiObject The UI button or frame to attach the count badge to.
--- @param count number The numeric unread count (displays nothing if 0 or negative).
--- @param positionOverride UDim2? Optional custom position.
--- @param anchorOverride Vector2? Optional custom anchor point.
function UIBadgeHelper.setBadgeCount(parent: GuiObject, count: number, positionOverride: UDim2?, anchorOverride: Vector2?)
    local existing = parent:FindFirstChild("IndicatorBadge")
    
    if count <= 0 then
        if existing then
            existing:Destroy()
        end
        return
    end
    
    local badgeText = tostring(count)
    if count > 999 then
        badgeText = "99+"
    end
    
    local charCount = #badgeText
    local textSize = 10
    if charCount == 2 then
        textSize = 8
    elseif charCount >= 3 then
        textSize = 6
    end

    if existing then
        local label = existing:FindFirstChild("CountLabel") :: TextLabel?
        if label then
            label.Text = badgeText
            label.TextSize = textSize
        end
        return
    end
    
    local selectedPos = positionOverride or UDim2.new(1, -8, 0, -8)
    local selectedAnchor = anchorOverride or Vector2.new(0.5, 0.5)
    
    local badge = Instance.new("Frame")
    badge.Name = "IndicatorBadge"
    badge.ZIndex = parent.ZIndex + 5
    applyStyle(badge, {
        Size = UDim2.new(0, 16, 0, 16),
        Position = selectedPos,
        AnchorPoint = selectedAnchor,
        BackgroundColor3 = BADGE_RED,
        BorderSizePixel = 0
    })
    badge.Parent = parent
    
    local corner = Instance.new("UICorner")
    corner.CornerRadius = UDim.new(0.5, 0)
    corner.Parent = badge
    
    local label = Instance.new("TextLabel")
    label.Name = "CountLabel"
    label.ZIndex = badge.ZIndex + 1
    applyStyle(label, {
        Size = UDim2.new(1, 0, 1, 0),
        BackgroundTransparency = 1,
        Text = badgeText,
        TextColor3 = BADGE_TEXT_COLOR,
        Font = Enum.Font.GothamBold,
        TextSize = textSize,
        TextXAlignment = Enum.TextXAlignment.Center,
        TextYAlignment = Enum.TextYAlignment.Center
    })
    label.Parent = badge
    
    local stroke = Instance.new("UIStroke")
    stroke.Color = Color3.fromRGB(25, 25, 25)
    stroke.Thickness = 1.2
    stroke.Parent = badge
end

return UIBadgeHelper
