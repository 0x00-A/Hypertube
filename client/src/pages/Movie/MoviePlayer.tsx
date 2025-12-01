import ReactPlayer from "react-player";
import { useParams } from "react-router-dom";

function MoviePlayer() {
  const { id } = useParams();

  return (
    <div>
      <h2>Movie Player</h2>
      <p>Playing movie ID: {id}</p>
      <div style={{ maxWidth: 800 }}>
        <ReactPlayer
          src="https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"
          controls
          width="100%"
        />
      </div>
    </div>
  );
}

export default MoviePlayer;
