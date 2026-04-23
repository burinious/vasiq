function AvatarUploader({ preview, onFileChange }) {
  return (
    <label className="avatar-uploader">
      <input className="file-input" type="file" accept="image/*" onChange={onFileChange} />
      <span className="file-pill">Choose avatar or GIF</span>
      <strong>Upload a profile image or GIF</strong>
      <p className="helper-text">
        Static photos work, but animated GIF avatars are welcome too.
      </p>
      {preview ? <img src={preview} alt="Avatar preview" className="avatar-preview" /> : null}
    </label>
  );
}

export default AvatarUploader;
