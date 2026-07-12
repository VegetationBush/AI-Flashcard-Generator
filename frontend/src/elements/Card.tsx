import React from "react";
import "./Card.css"

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export default function Card({
  children,
  style,
  onClick,
}: CardProps) {
  return (
    <div
      className = "card"
      onClick={onClick}
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #ddd",
        padding: 16,
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        boxSizing: "border-box",
        transition: "0.2s ease",
        ...style,
      }}
    >
      {children}
    </div>
  );
}