"use client";

export const LoadingModal = () => {
  return (
    <div className="privacy-modal-backdrop">
      <div
        className="privacy-modal"
        style={{ textAlign: "center" }}
      >
        <h3>Procesando registro...</h3>
        <div className="spinner"></div>
      </div>
    </div>
  );
};