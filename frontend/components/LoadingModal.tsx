"use client";

export const LoadingModal = () => {
  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ textAlign: "center" }}>
        <h3>Procesando registro...</h3>
        <div className="spinner"></div>
      </div>
    </div>
  );
};