import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import { useAuth } from "../context/AuthContext";
import "./CoachPages.css";

const CoachAthletesPage = () => {
  const navigate = useNavigate();
  const { triggerUpdate } = useAuth();
  const [athletes, setAthletes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAthlete, setSelectedAthlete] = useState(null);

  const fetchAthletes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(
        "http://localhost:8080/api/coach/athletes"
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Ошибка загрузки спортсменов");
      }
      const data = await response.json();
      setAthletes(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching athletes:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAthletes();
  }, [triggerUpdate]);

  // Автообновление при фокусе
  useEffect(() => {
    const handleFocus = () => {
      fetchAthletes();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchAthletes]);

  if (loading) {
    return (
      <div className="coach-page">
        <div className="loading">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="coach-page">
        <header className="header">
          <div className="container header-container">
            <div className="logo" onClick={() => navigate("/")}>
              <span className="logo-text">FORCE LAB</span>
            </div>
            <div className="header-actions">
              <button className="btn-outline" onClick={() => navigate("/")}>
                На главную
              </button>
            </div>
          </div>
        </header>
        <main className="container">
          <div className="error">{error}</div>
        </main>
      </div>
    );
  }

  return (
    <div className="coach-page">
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
              + Создать тренировку
            </button>
          </div>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">👥 Мои спортсмены</h1>

        {selectedAthlete ? (
          <div className="athlete-detail">
            <button
              className="btn-outline"
              onClick={() => setSelectedAthlete(null)}
            >
              ← К списку
            </button>

            <div className="athlete-profile-card">
              <div className="athlete-avatar">🏃</div>
              <h2>{selectedAthlete.fullName}</h2>
              <div className="athlete-info-grid">
                <div className="info-item">
                  <span className="label">📧 Email:</span>
                  <span>{selectedAthlete.email}</span>
                </div>
                <div className="info-item">
                  <span className="label">🎯 Вид спорта:</span>
                  <span>{selectedAthlete.sportType || "Не указан"}</span>
                </div>
                <div className="info-item">
                  <span className="label">⭐ Разряд:</span>
                  <span>{selectedAthlete.rank || "Не указан"}</span>
                </div>
                <div className="info-item">
                  <span className="label">📊 Статус:</span>
                  <span
                    className={`status-badge ${selectedAthlete.status?.toLowerCase()}`}
                  >
                    {selectedAthlete.status === "ACTIVE"
                      ? "Активный"
                      : "Неактивный"}
                  </span>
                </div>
              </div>
            </div>

            <div className="quick-actions">
              <button
                className="btn-primary"
                onClick={() => navigate("/training-plans")}
              >
                📅 Назначить план
              </button>
              <button
                className="btn-primary"
                onClick={() => navigate("/progress")}
              >
                📈 Посмотреть прогресс
              </button>
            </div>
          </div>
        ) : (
          <>
            {athletes.length === 0 ? (
              <div className="no-data">
                <p>У вас пока нет спортсменов</p>
              </div>
            ) : (
              <div className="athletes-grid">
                {athletes.map((athlete) => (
                  <div
                    key={athlete.id}
                    className="athlete-card"
                    onClick={() => setSelectedAthlete(athlete)}
                  >
                    <div className="card-header">
                      <div className="athlete-icon">🏃</div>
                      <span
                        className={`status ${athlete.status?.toLowerCase()}`}
                      >
                        {athlete.status === "ACTIVE" ? "✓" : "✗"}
                      </span>
                    </div>
                    <h3>{athlete.fullName}</h3>
                    <div className="card-info">
                      <p>🎯 {athlete.sportType || "Спорт не указан"}</p>
                      <p>⭐ {athlete.rank || "Без разряда"}</p>
                      <p>📧 {athlete.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CoachAthletesPage;
