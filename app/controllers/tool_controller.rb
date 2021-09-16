class ToolController < ApplicationController

    before_action :authenticate_user!

    def show

    end

    def create

    end

    def update

    end

    def destroy

    end

    private

    def tool_params
        params.require(:tool).permit(:parameters, :results, :status)
    end
end
