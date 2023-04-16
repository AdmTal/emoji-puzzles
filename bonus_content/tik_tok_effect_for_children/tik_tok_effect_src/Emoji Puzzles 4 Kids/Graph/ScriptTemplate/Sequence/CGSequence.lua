local CGSequence = CGSequence or {}
CGSequence.__index = CGSequence

function CGSequence.new()
    local self = setmetatable({}, CGSequence)
    self.nexts = {}
    return self
end

function CGSequence:setNext(index, func)
    self.nexts[index] = func
end

function CGSequence:execute(index)
    if self.nexts[0] then
        self.nexts[0]()
    end
    if self.__contextStack ~= nil and #self.__contextStack > 0 then
    	if self.__contextStack[#self.__contextStack][1] == "return" then
    		return
   		end
    end
    if self.nexts[1] then
        self.nexts[1]()
    end
    if self.__contextStack ~= nil and #self.__contextStack > 0 then
    	if self.__contextStack[#self.__contextStack][1] == "return" then
    		return
   		end
    end
    if self.nexts[2] then
        self.nexts[2]()
    end
end

return CGSequence
