local CGSubtract = CGSubtract or {}
CGSubtract.__index = CGSubtract

function CGSubtract.new()
    local self = setmetatable({}, CGSubtract)
    self.inputs = {}
    return self
end

function CGSubtract:setInput(index, func)
    self.inputs[index] = func
end

function CGSubtract:getOutput(index)
    local v1 = self.inputs[0]()
    local v2 = self.inputs[1]()
    if v1 == nil or v2 == nil then
        return nil
    end
    return self.inputs[0]() - self.inputs[1]()
end

return CGSubtract
