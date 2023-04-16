local CGIfElse = CGIfElse or {}
CGIfElse.__index = CGIfElse

function CGIfElse.new()
    local self = setmetatable({}, CGIfElse)
    self.inputs = {}
    self.nexts = {}
    return self
end

function CGIfElse:setNext(index, func)
    self.nexts[index] = func
end

function CGIfElse:setInput(index, func)
    self.inputs[index] = func
end

function CGIfElse:execute()
    if self.inputs[1]() then
        if self.nexts[0] then
            self.nexts[0]()
        end
    else
        if self.nexts[1] then
            self.nexts[1]()
        end
    end
end

return CGIfElse
