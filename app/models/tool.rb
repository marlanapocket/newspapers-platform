class Tool < ActiveRecord::Base

    belongs_to :experiment, optional: false

    def to_h
        {
          "tool": {
            "id": self.id,
            # "type": self.tool_type,
            # "status": self.status,
            # "parameters": self.parameters
          },
          "children": []
        }
    end

    def run
        ToolRunnerWorker.perform_async(self.id, self.experiment.user.id, self.tool_type, self.parameters)
    end

end
