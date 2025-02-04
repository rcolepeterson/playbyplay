ffmpeg -i boy-chores_output.mp4 -c:v libx264 -c:a aac -strict experimental -crf 28 -preset fast -movflags +faststart boy-chores_output_two.mp4
