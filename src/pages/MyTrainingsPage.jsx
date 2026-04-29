import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import { useAuth } from "../context/AuthContext";
import "./MyTrainingsPage.css";

const MyTrainingsPage = () => {
  const navigate = useNavigate();
  const { triggerUpdate } = useAuth();
  const [myTrainings, setMyTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("active"); // active, completed

  const fetchMyTrainings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        "http://localhost:8080/api/trainings/my"
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ошибка загрузки");
      }
      const data = await response.json();
      setMyTrainings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyTrainings();
  }, [triggerUpdate]);

  // Автообновление при фокусе
  useEffect(() => {
    const handleFocus = () => fetchMyTrainings();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchMyTrainings]);

  const handleCancelRegistration = async (trainingId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/trainings/${trainingId}/cancel`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Ошибка отмены");
      alert("Регистрация отменена");
      fetchMyTrainings();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredTrainings = myTrainings.filter((training) => {
    const now = new Date();
    const trainingDate = new Date(training.trainingDate);

    if (activeTab === "active") {
      return trainingDate > now;
    } else {
      return trainingDate <= now;
    }
  });

  if (loading) return <div className="loading">Загрузка...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="my-trainings-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-text">FORCE LAB</span>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate("/trainings")}
            >
              Все тренировки
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">📅 Мои тренировки</h1>

        {/* Табы */}
        <div className="tabs">
          <button
            className={`tab ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            🟢 Активные (
            {
              myTrainings.filter((t) => new Date(t.trainingDate) > new Date())
                .length
            }
            )
          </button>
          <button
            className={`tab ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            ✅ Завершенные (
            {
              myTrainings.filter((t) => new Date(t.trainingDate) <= new Date())
                .length
            }
            )
          </button>
        </div>

        {/* Список тренировок */}
        {filteredTrainings.length === 0 ? (
          <div className="no-data">
            <p>
              Нет {activeTab === "active" ? "активных" : "завершенных"}{" "}
              тренировок
            </p>
          </div>
        ) : (
          <div className="trainings-list">
            {filteredTrainings.map((training) => (
              <div key={training.id} className="training-item">
                <div className="training-status">
                  {new Date(training.trainingDate) > new Date() ? "🟢" : "✅"}
                </div>
                <div className="training-content">
                  <h3>{training.title}</h3>
                  <div className="training-details">
                    <span>📅 {formatDate(training.trainingDate)}</span>
                    <span>⏱️ {training.durationMinutes} мин</span>
                    <span>📍 {training.location || "Не указано"}</span>
                    <span>🏋️ {training.sportType}</span>
                    <span>👨‍🏫 {training.coachName || "Тренер не назначен"}</span>
                  </div>
                  {training.description && (
                    <p className="training-description">
                      {training.description}
                    </p>
                  )}
                </div>
                {new Date(training.trainingDate) > new Date() && (
                  <button
                    className="btn-cancel"
                    onClick={() => handleCancelRegistration(training.id)}
                  >
                    Отменить запись
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MyTrainingsPage;
