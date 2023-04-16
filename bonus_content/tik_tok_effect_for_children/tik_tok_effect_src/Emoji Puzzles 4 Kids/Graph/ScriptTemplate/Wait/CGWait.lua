local CGWait = CGWait or {}
CGWait.__index = CGWait

function CGWait.new()
    local self = setmetatable({}, CGWait)
    self.inputs = {}
    self.outputs = {}
    self.nexts = {}
    self.timeUsed = 0
    self.enable = false
    return self
end

function CGWait:setNext(index, func)
    self.nexts[index] = func
end

function CGWait:setInput(index, func)
    self.inputs[index] = func
end

function CGWait:getOutput(index)
    return self.inputs[index]()
end

function CGWait:execute()
    self.enable = true
end

function CGWait:update(sys, deltaTime)
    if not self.enable then
        return
    end

    self.timeUsed = deltaTime + self.timeUsed
    if self.timeUsed < self.inputs[1]() then
        return
    end
    if self.nexts[0] then
        self.timeUsed = 0
        self.enable = false
        self.nexts[0]()
    end
end

return CGWait