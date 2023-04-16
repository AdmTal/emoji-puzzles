--
-- Created by IntelliJ IDEA.
-- User: xuyuan
-- Date: 2021/7/28
-- Time: 19:52
-- To change this template use File | Settings | File Templates.
--

local CGTimer = CGTimer or {}
CGTimer.__index = CGTimer

function CGTimer.new()
    local self = setmetatable({}, CGTimer)
    self.inputs = {}
    self.outputs = {}
    self.nexts = {}
    self.beginTime = 0
    self.state = ""
    self.duration = nil
    return self
end

function CGTimer:setNext(index, func)
    self.nexts[index] = func
end

function CGTimer:setInput(index, func)
    self.inputs[index] = func
end

function CGTimer:execute(index)
    if index == 0 then
        self.state = "start"
        self.beginTime = 0
        self.duration = self.inputs[3]()
        self.outputs[3] = 0
        self.outputs[4] = 0
        self.outputs[5] = self.duration
        if self.nexts[0] then
            self.nexts[0]()
        end
    elseif index == 1 then
        self.state = "pause"
    elseif index == 2 then
        self.state = "start"
    end
end

function CGTimer:getOutput(index)
    return self.outputs[index]
end

function CGTimer:update(sys, dt)
    if self.state ~= "start" then
        return
    end
    self.beginTime = self.beginTime + dt
    if self.beginTime < self.duration then
        if self.nexts[1] then
            self.nexts[1]()
        end
        self.outputs[3] = self.beginTime
        self.outputs[4] = self.beginTime / self.duration * 100
        self.outputs[5] = self.duration - self.beginTime
    end
    if self.beginTime >= self.duration then
        if self.nexts[2] then
            self.nexts[2]()
        end
        self.outputs[3] = self.duration
        self.outputs[4] = 100
        self.outputs[5] = 0
        self.state = "finish"
    end
end

return CGTimer
