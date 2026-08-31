--!strict
--- Server-side Infrastructure Adapter wrapping Roblox animation/animator APIs.
-- @module AnimationServerAdapter
local AnimationServerAdapter = {}

--- Verifies if an instance is a valid Model
function AnimationServerAdapter.IsModel(inst: any): boolean
    return typeof(inst) == "Instance" and inst:IsA("Model")
end

--- Connects to the Destroying signal of a Model instance
function AnimationServerAdapter.OnDestroyed(model: Model, callback: () -> ()): RBXScriptConnection?
    if not AnimationServerAdapter.IsModel(model) then return nil end
    return model.Destroying:Connect(callback)
end

--- Finds or creates an Animator on the target model's Humanoid or AnimationController.
function AnimationServerAdapter.GetAnimator(model: Model): Animator?
    if not AnimationServerAdapter.IsModel(model) then
        return nil
    end

    local parentObj: Instance? = model:FindFirstChildOfClass("Humanoid") or model:FindFirstChildOfClass("AnimationController")
    if not parentObj then return nil end
    
    local animator = parentObj:FindFirstChildOfClass("Animator")
    if not animator then
        animator = Instance.new("Animator")
        animator.Name = "Animator"
        animator.Parent = parentObj
    end
    return animator
end

--- Detects the rig type of the humanoid.
function AnimationServerAdapter.GetRigType(model: Model): string
    if not AnimationServerAdapter.IsModel(model) then
        return "R15"
    end

    if model:GetAttribute("RigType") then
        return tostring(model:GetAttribute("RigType"))
    end
    
    local humanoid = model:FindFirstChildOfClass("Humanoid")
    if humanoid and humanoid.RigType == Enum.HumanoidRigType.R6 then
        return "R6"
    end
    
    return "R15"
end

--- Creates a new Animation instance with the given asset URL.
function AnimationServerAdapter.CreateAnimation(assetUrl: string | number): Animation?
    local strVal = tostring(assetUrl or "")
    if strVal == "" then return nil end

    local animation = Instance.new("Animation")
    if string.match(strVal, "^rbxassetid://") or string.match(strVal, "^http") then
        animation.AnimationId = strVal
    elseif string.match(strVal, "^%d+$") then
        animation.AnimationId = "rbxassetid://" .. strVal
    else
        animation.AnimationId = strVal
    end
    return animation
end

--- Loads and returns an AnimationTrack on the animator.
function AnimationServerAdapter.LoadTrack(animator: Animator, animation: Animation): (boolean, AnimationTrack?)
    if typeof(animator) ~= "Instance" or not animator:IsA("Animator") then return false, nil end
    if typeof(animation) ~= "Instance" or not animation:IsA("Animation") then return false, nil end

    local success, track = pcall(function()
        return animator:LoadAnimation(animation)
    end)
    return success, track
end

--- Plays a loaded track.
function AnimationServerAdapter.PlayTrack(track: AnimationTrack, fadeTime: number?, weight: number?, speed: number?): boolean
    if not track then return false end
    local success = pcall(function()
        track:Play(fadeTime or 0.3, weight or 1, speed or 1)
    end)
    return success
end

--- Stops a loaded track.
function AnimationServerAdapter.StopTrack(track: AnimationTrack, fadeTime: number?): boolean
    if not track then return false end
    local success = pcall(function()
        track:Stop(fadeTime or 0.3)
    end)
    return success
end

--- Destroys a track or animation instance safely.
function AnimationServerAdapter.DestroyInstance(inst: Instance?)
    if typeof(inst) == "Instance" then
        pcall(function()
            inst:Destroy()
        end)
    end
end

--- Stops all playing tracks on the animator.
function AnimationServerAdapter.StopPlayingTracks(animator: Animator, fadeTime: number?)
    if typeof(animator) ~= "Instance" or not animator:IsA("Animator") then return end
    for _, track in ipairs(animator:GetPlayingAnimationTracks()) do
        pcall(function()
            track:Stop(fadeTime or 0.3)
        end)
    end
end

return AnimationServerAdapter
