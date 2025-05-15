export function timeToSecs(time) {
  const [mins, secs] = time.split(":").map(Number);
  return mins * 60 + secs;
}

export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
}
