--!strict
--- Client Controller caching unread alerts and badges indicator configurations.
-- @module IndicatorController
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Knit = require(ReplicatedStorage.Packages.Knit)

local IndicatorController = Knit.CreateController {
    Name = "IndicatorController"
}

function IndicatorController:KnitInit()
    print("[IndicatorController] Initializing...")
    self._indicators = {}
    
    -- Reusable BindableEvent to broadcast changes to presenters
    self.IndicatorChanged = Instance.new("BindableEvent")
end

function IndicatorController:KnitStart()
    local IndicatorService = Knit.GetService("IndicatorService")
    
    -- Load initial indicators cache from Server
    task.spawn(function()
        local success, initialData = IndicatorService:GetIndicators():await()
        if success and initialData then
            self._indicators = initialData
            for category, value in pairs(initialData) do
                self.IndicatorChanged:Fire(category, value)
            end
        end
    end)
    
    -- Listen to real-time updates from Server
    IndicatorService.IndicatorChanged:Connect(function(category: string, value: any)
        self._indicators[category] = value
        self.IndicatorChanged:Fire(category, value)
    end)
    
    print("[IndicatorController] Started.")
end

--- @function GetIndicator
--- @brief Queries the cached value of a specific indicator.
--- @param category string The alert key.
--- @return any
function IndicatorController:GetIndicator(category: string): any
    return self._indicators[category]
end

--- @function GetUnreadCount
--- @brief Returns the numeric count or 1 if it's boolean true, returns 0 if false/nil.
--- @param category string The alert key.
--- @return number
function IndicatorController:GetUnreadCount(category: string): number
    local val = self._indicators[category]
    if type(val) == "number" then
        return val
    elseif type(val) == "boolean" then
        return val and 1 or 0
    end
    return 0
end

return IndicatorController
