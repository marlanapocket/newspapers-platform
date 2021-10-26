class ApplicationController < ActionController::Base

    def send_file
        File.open("tmp/#{params[:filename]}", 'r') do |f|
            send_data f.read, type: "text/json", filename: params[:filename]
        end
    end

end
