import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import "./TrainingsPage.css";

const TrainingsPage = () => {
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTraining, setNewTraining] = useState({
    title: "",
    description: "",
    trainingDate: "",
    durationMinutes: 60,
    location: "",
    sportType: "",
    maxParticipants: 20,
  });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      setIsLoggedIn(true);
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role || "ATHLETE");
      } catch (e) {
        console.error("Error decoding token");
      }
    }
    fetchTrainings();
  }, []);

  const fetchTrainings = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/trainings/upcoming"
      );
      if (!response.ok) throw new Error("Ошибка загрузки тренировок");
      const data = await response.json();
      setTrainings(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (trainingId) => {
    if (!isLoggedIn) {
      alert("Для записи на тренировку необходимо войти в систему");
      navigate("/login");
      return;
    }

    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/trainings/${trainingId}/register`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Ошибка регистрации");
      }
      alert("Вы успешно зарегистрированы на тренировку!");
      fetchTrainings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (trainingId) => {
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/trainings/${trainingId}/cancel`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Ошибка отмены");
      alert("Регистрация отменена");
      fetchTrainings();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateTraining = async (e) => {
    e.preventDefault();
    try {
      const response = await fetchWithAuth(
        "http://localhost:8080/api/trainings",
        {
          method: "POST",
          body: JSON.stringify(newTraining),
        }
      );
      if (!response.ok) throw new Error("Ошибка создания тренировки");
      alert("Тренировка создана!");
      setShowCreateForm(false);
      setNewTraining({
        title: "",
        description: "",
        trainingDate: "",
        durationMinutes: 60,
        location: "",
        sportType: "",
        maxParticipants: 20,
      });
      fetchTrainings();
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

  const getStatusClass = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date < now) return "completed";
    if (date - now < 24 * 60 * 60 * 1000) return "soon";
    return "upcoming";
  };

  const getStatusText = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    if (date < now) return "Завершена";
    if (date - now < 24 * 60 * 60 * 1000) return "Скоро";
    return "Предстоит";
  };

  if (loading) return <div className="loading">Загрузка тренировок...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="trainings-page">
      <header className="header">
        <div className="container header-container">
          <div
            className="logo"
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
          >
            <span className="logo-icon">⚡</span>
            <span className="logo-text">FORCE LAB</span>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
            {userRole === "COACH" && (
              <button
                className="btn-primary"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? "Отмена" : "+ Создать тренировку"}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ДОБАВЬТЕ ЭТОТ БЛОК - отступ для фиксированного header */}
      <div className="header-spacer"></div>

      <main className="container">
        {/* ДОБАВЬТЕ ЗАГОЛОВОК СТРАНИЦЫ */}
        <h1 className="page-title">🏋️‍♂️ Тренировки</h1>

        {showCreateForm && userRole === "COACH" && (
          <div className="create-training-form">
            <h3>Создать новую тренировку</h3>
            <form onSubmit={handleCreateTraining}>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Название тренировки *"
                    value={newTraining.title}
                    onChange={(e) =>
                      setNewTraining({ ...newTraining, title: e.target.value })
                    }
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="datetime-local"
                    placeholder="Дата и время *"
                    value={newTraining.trainingDate}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        trainingDate: e.target.value,
                      })
                    }
                    required
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Вид спорта *"
                    value={newTraining.sportType}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        sportType: e.target.value,
                      })
                    }
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Место проведения"
                    value={newTraining.location}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        location: e.target.value,
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="number"
                    placeholder="Длительность (мин)"
                    value={newTraining.durationMinutes}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        durationMinutes: parseInt(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <input
                    type="number"
                    placeholder="Макс. участников"
                    value={newTraining.maxParticipants}
                    onChange={(e) =>
                      setNewTraining({
                        ...newTraining,
                        maxParticipants: parseInt(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>
              <div className="form-group">
                <textarea
                  placeholder="Описание тренировки"
                  value={newTraining.description}
                  onChange={(e) =>
                    setNewTraining({
                      ...newTraining,
                      description: e.target.value,
                    })
                  }
                  className="form-input"
                  rows="3"
                />
              </div>
              <button type="submit" className="btn-primary">
                Создать
              </button>
            </form>
          </div>
        )}

        {trainings.length === 0 ? (
          <div className="no-trainings">
            <p>Нет запланированных тренировок</p>
          </div>
        ) : (
          <div className="trainings-grid">
            {trainings.map((training) => (
              <div
                key={training.id}
                className="training-card"
                onClick={() => navigate(`/trainings/${training.id}`)}
                style={{ cursor: "pointer" }}
              >
                <div className="training-header">
                  <h3>{training.title}</h3>
                  <span
                    className={`status-badge ${getStatusClass(
                      training.trainingDate
                    )}`}
                  >
                    {getStatusText(training.trainingDate)}
                  </span>
                </div>
                <div className="training-info">
                  <div className="info-row">
                    <span className="info-icon">📅</span>
                    <span>{formatDate(training.trainingDate)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">⏱️</span>
                    <span>{training.durationMinutes} минут</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">📍</span>
                    <span>{training.location || "Не указано"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">🏋️‍♂️</span>
                    <span>{training.sportType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">👤</span>
                    <span>Тренер: {training.coachName || "Не назначен"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-icon">👥</span>
                    <span>
                      Участники: {training.currentParticipants || 0} /{" "}
                      {training.maxParticipants || "∞"}
                    </span>
                  </div>
                  {training.description && (
                    <div className="info-row description">
                      <span className="info-icon">📝</span>
                      <p>{training.description}</p>
                    </div>
                  )}
                </div>
                {isLoggedIn &&
                  userRole === "ATHLETE" &&
                  new Date(training.trainingDate) > new Date() && (
                    <div className="training-actions">
                      <button
                        className="btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegister(training.id);
                        }}
                      >
                        Записаться
                      </button>
                      <button
                        className="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancel(training.id);
                        }}
                      >
                        Отменить
                      </button>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default TrainingsPage;
