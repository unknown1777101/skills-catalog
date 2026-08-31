--!strict
--- Server Service managing player alert indicators (red dots, badges, count totals).
-- @module IndicatorService
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Knit = require(ReplicatedStorage.Packages.Knit)

local IndicatorService = Knit.CreateService {
    Name = "IndicatorService",
    Client = {
        -- Fired to client when a specific category indicator changes
        IndicatorChanged = Knit.CreateSignal(),
        
        -- Client queries initial indicators dictionary
        GetIndicators = function(self, player: Player): { [string]: any }
            return self.Server:GetIndicators(player)
        end
    }
}

function IndicatorService:KnitInit()
    print("[IndicatorService] Initializing...")
end

function IndicatorService:KnitStart()
    local Players = game:GetService("Players")
    
    local function onPlayerJoined(player: Player)
        -- Set up defaults if data isn't loaded
        local PlayerDataStoreService = Knit.GetService("PlayerDataStoreService")
        local profile = PlayerDataStoreService:GetProfileData(player)
        
        -- Yield lock helper to wait if player profile isn't fully ready
        local startTime = os.clock()
        while not profile and os.clock() - startTime < 5 do
            task.wait(0.1)
            profile = PlayerDataStoreService:GetProfileData(player)
        end
        
        if profile and not profile.Indicators then
            profile.Indicators = {
                Shop = false,
                Notifications = 0,
                Quests = 0
            }
        end
    end
    
    Players.PlayerAdded:Connect(onPlayerJoined)
    for _, player in ipairs(Players:GetPlayers()) do
        onPlayerJoined(player)
    end
    
    print("[IndicatorService] Started.")
end

--- @function GetIndicators
--- @brief Returns the entire indicator database table for a player.
--- @param player Player The target player.
--- @return { [string]: any }
function IndicatorService:GetIndicators(player: Player): { [string]: any }
    local PlayerDataStoreService = Knit.GetService("PlayerDataStoreService")
    local profile = PlayerDataStoreService:GetProfileData(player)
    if profile then
        return profile.Indicators or {}
    end
    return {}
end

--- @function SetIndicator
--- @brief Updates an indicator category to a new value (number or boolean) and syncs to client.
--- @param player Player The target player.
--- @param category string The alert key (e.g. "Shop", "Quests").
--- @param value any The value (boolean or integer).
function IndicatorService:SetIndicator(player: Player, category: string, value: any)
    local PlayerDataStoreService = Knit.GetService("PlayerDataStoreService")
    PlayerDataStoreService:UpdateProfileData(player, function(profile)
        if not profile.Indicators then
            profile.Indicators = {}
        end
        profile.Indicators[category] = value
    end)
    
    self.Client.IndicatorChanged:Fire(player, category, value)
end

--- @function IncrementIndicator
--- @brief Increments a numeric indicator by a specified amount (default 1).
--- @param player Player The target player.
--- @param category string The alert key.
--- @param amount number? Optional increment step.
function IndicatorService:IncrementIndicator(player: Player, category: string, amount: number?)
    local step = amount or 1
    local PlayerDataStoreService = Knit.GetService("PlayerDataStoreService")
    local newValue = step
    
    PlayerDataStoreService:UpdateProfileData(player, function(profile)
        if not profile.Indicators then
            profile.Indicators = {}
        end
        local current = tonumber(profile.Indicators[category]) or 0
        newValue = current + step
        profile.Indicators[category] = newValue
    end)
    
    self.Client.IndicatorChanged:Fire(player, category, newValue)
end

--- @function DecrementIndicator
--- @brief Decrements a numeric indicator (capped at 0).
--- @param player Player The target player.
--- @param category string The alert key.
--- @param amount number? Optional decrement step.
function IndicatorService:DecrementIndicator(player: Player, category: string, amount: number?)
    local step = amount or 1
    local PlayerDataStoreService = Knit.GetService("PlayerDataStoreService")
    local newValue = 0
    
    PlayerDataStoreService:UpdateProfileData(player, function(profile)
        if not profile.Indicators then
            profile.Indicators = {}
        end
        local current = tonumber(profile.Indicators[category]) or 0
        newValue = math.max(0, current - step)
        profile.Indicators[category] = newValue
    end)
    
    self.Client.IndicatorChanged:Fire(player, category, newValue)
end

--- @function ClearIndicator
--- @brief Resets an indicator to false or 0.
--- @param player Player The target player.
--- @param category string The alert key.
function IndicatorService:ClearIndicator(player: Player, category: string)
    self:SetIndicator(player, category, false)
end

return IndicatorService
