--!strict
--- Server Knit Service managing character animations and emote playback.
--- Adheres strictly to Clean Architecture by delegating engine calls to AnimationServerAdapter.
-- @module AnimationService

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Packages = ReplicatedStorage:WaitForChild("Packages") :: Folder
local Knit = require(Packages:WaitForChild("Knit") :: ModuleScript)
local Trove = (Packages:FindFirstChild("Trove") and require(Packages.Trove :: ModuleScript)) or Knit.Util.Trove
local CatalogConfig = require(ReplicatedStorage.Shared.Domain.Component.Catalog.CatalogConfig)

local AnimationServerAdapter = require(script.Parent.Parent.Infrastructure.AnimationServerAdapter)

export type AnimKey = string | { Id: string?, Path: string?, AssetId: string? }

local AnimationService = Knit.CreateService {
    Name = "AnimationService",
    Client = {},
}

function AnimationService:KnitInit()
    self._trove = Trove.new()
    self._trackCache = setmetatable({}, { __mode = "k" }) -- Weak keys prevent memory leaks on unparented models
    self._modelTroves = setmetatable({}, { __mode = "k" }) -- Weak keys for model lifetime troves
end

function AnimationService:KnitStart()
end

--- Internal helper to safely clean track cache for a model.
function AnimationService:CleanModelCache(model: Model)
    local cache = self._trackCache[model]
    if cache then
        for _, entry in pairs(cache) do
            if entry.track then
                AnimationServerAdapter.StopTrack(entry.track, 0)
                AnimationServerAdapter.DestroyInstance(entry.track)
            end
            if entry.animation then
                AnimationServerAdapter.DestroyInstance(entry.animation)
            end
        end
        self._trackCache[model] = nil
    end

    local modelTrove = self._modelTroves[model]
    if modelTrove then
        modelTrove:Destroy()
        self._modelTroves[model] = nil
    end
end

--- Gets or creates an AnimationTrack for a given model and animation key/URL.
function AnimationService:GetTrack(model: Model, animKeyInput: AnimKey): AnimationTrack?
    if not AnimationServerAdapter.IsModel(model) then return nil end

    local animKey = ""
    if type(animKeyInput) == "table" then
        animKey = tostring(animKeyInput.Id or animKeyInput.Path or animKeyInput.AssetId or "")
    elseif type(animKeyInput) == "string" then
        animKey = animKeyInput
    else
        animKey = tostring(animKeyInput or "")
    end

    if animKey == "" then return nil end

    local animator = AnimationServerAdapter.GetAnimator(model)
    if not animator then return nil end

    self._trackCache[model] = self._trackCache[model] or {}
    local cache = self._trackCache[model]

    if not self._modelTroves[model] then
        local modelTrove = self._trove:Extend()
        self._modelTroves[model] = modelTrove
        
        local conn = AnimationServerAdapter.OnDestroyed(model, function()
            self:CleanModelCache(model)
        end)
        if conn then
            modelTrove:Add(conn)
        end
    end

    local cachedEntry = cache[animKey]
    if cachedEntry then
        return cachedEntry.track
    end

    local animUrl = ""
    if string.match(animKey, "^rbxassetid://") or string.match(animKey, "^http") then
        animUrl = animKey
    elseif string.match(animKey, "^%d+$") then
        animUrl = "rbxassetid://" .. animKey
    else
        local animDict = CatalogConfig.Animation :: { [string]: any }?
        if animDict and animDict[animKey] then
            local rawCatEntry = animDict[animKey]
            local catVal = if type(rawCatEntry) == "table" then tostring(rawCatEntry.Id or rawCatEntry.Path or rawCatEntry.AssetId or "") else tostring(rawCatEntry or "")
            if string.match(catVal, "^rbxassetid://") or string.match(catVal, "^http") then
                animUrl = catVal
            elseif string.match(catVal, "^%d+$") then
                animUrl = "rbxassetid://" .. catVal
            end
        end
    end

    if animUrl == "" then
        return nil
    end

    local animation = AnimationServerAdapter.CreateAnimation(animUrl)
    if not animation then return nil end

    local success, track = AnimationServerAdapter.LoadTrack(animator, animation)

    if success and track then
        cache[animKey] = {
            track = track,
            animation = animation
        }
        return track
    else
        if animation then
            AnimationServerAdapter.DestroyInstance(animation)
        end
        return nil
    end
end

--- Plays a named animation on a model, optionally stopping all other playing tracks.
function AnimationService:Play(
    model: Model, 
    animKey: AnimKey, 
    fadeTime: number?, 
    weight: number?, 
    speed: number?, 
    stopOthers: boolean?
): boolean
    local track = self:GetTrack(model, animKey)
    if not track then return false end

    local defaultFade = fadeTime or 0.3

    if stopOthers ~= false then
        local animator = AnimationServerAdapter.GetAnimator(model)
        if animator then
            AnimationServerAdapter.StopPlayingTracks(animator, defaultFade)
        end
    end

    return AnimationServerAdapter.PlayTrack(track, defaultFade, weight, speed)
end

--- Stops a named animation on a model.
function AnimationService:Stop(model: Model, animKey: AnimKey, fadeTime: number?): boolean
    local track = self:GetTrack(model, animKey)
    if not track then return false end

    return AnimationServerAdapter.StopTrack(track, fadeTime)
end

--- Stops all animations playing on a model.
function AnimationService:StopAll(model: Model, fadeTime: number?)
    local cache = self._trackCache[model]
    if cache then
        for _, entry in pairs(cache) do
            if entry.track then
                AnimationServerAdapter.StopTrack(entry.track, fadeTime or 0.3)
            end
        end
    end
end

return AnimationService
