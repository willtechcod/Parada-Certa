"use client";

import { AlertTriangle, CheckCircle, XCircle, Trash2 } from "lucide-react";
import { Modal } from "./Modal";

export type AlertType = "success" | "error" | "confirm" | "warning";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  title,
  message,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false,
}: AlertModalProps) {
  const icons = {
    success: <CheckCircle className="text-green-500" size={48} />,
    error: <XCircle className="text-red-500" size={48} />,
    warning: <AlertTriangle className="text-yellow-500" size={48} />,
    confirm: <Trash2 className="text-red-500" size={48} />,
  };

  const buttonColors = {
    success: "bg-green-600 hover:bg-green-700",
    error: "bg-red-600 hover:bg-red-700",
    warning: "bg-yellow-600 hover:bg-yellow-700",
    confirm: "bg-red-600 hover:bg-red-700",
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center space-y-4">
        <div className="flex justify-center">{icons[type]}</div>
        <p className="text-gray-300">{message}</p>
        <div className="flex gap-3 pt-4">
          {type === "confirm" && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              disabled={isLoading}
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={type === "confirm" ? onConfirm : onClose}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors ${
              buttonColors[type]
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={isLoading}
          >
            {isLoading ? "Processando..." : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
