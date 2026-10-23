import { useState, useRef, useEffect } from "react";
import apiClient from "../services/apiClient.js";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function AvatarUploader() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const inputRef = useRef(null);

  // Task 3: create the preview URL, revoke it when the file changes or unmounts
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Task 2: validate before any network request
  function validate(f) {
    if (!ALLOWED.includes(f.type)) {
      return "Only JPEG, PNG, WebP or GIF images are allowed.";
    }
    if (f.size > MAX_SIZE) {
      return "File must be 5MB or smaller.";
    }
    return "";
  }

  function chooseFile(f) {
    if (!f) return;
    const msg = validate(f);
    if (msg) {
      setError(msg);
      setFile(null);
      return;
    }
    setError("");
    setProgress(0);
    setUploadedUrl("");
    setFile(f);
  }

  // Task 1: drag-and-drop. preventDefault stops the browser opening the file.
  function onDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function onDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    chooseFile(e.dataTransfer.files[0]);
  }

  // Task 4: upload with progress. Do not set Content-Type manually.
  async function upload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("avatar", file);

    try {
      const res = await apiClient.post("/api/upload", formData, {
        onUploadProgress: (event) => {
          setProgress(Math.round((event.loaded * 100) / event.total));
        },
      });
      setUploadedUrl(res.data.url);
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    }
  }

  return (
    <div>
      <div
        className={`drop-zone ${isDragging ? "dragging" : ""}`}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <p>Drag an image here, or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED.join(",")}
          hidden
          onChange={(e) => chooseFile(e.target.files[0])}
        />
      </div>

      {error && <p className="error">{error}</p>}

      {file && preview && (
        <img className="preview" src={preview} alt="Selected avatar preview" />
      )}

      {file && (
        <button onClick={upload} disabled={progress > 0 && progress < 100}>
          Upload
        </button>
      )}

      {progress > 0 && (
        <div className="bar">
          <div className="fill" style={{ width: `${progress}%` }} />
        </div>
      )}

      {uploadedUrl && <p>Uploaded: {uploadedUrl}</p>}
    </div>
  );
}