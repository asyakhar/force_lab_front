import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../api";
import { useAuth } from "../context/AuthContext";
import "./TrainingsPage.css";

const TrainingsPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userRole, triggerUpdate } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTraining, setEditingTraining] = useState(null);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    trainingDate: "",
    durationMinutes: 60,
    location: "",
    sportType: "",
    maxParticipants: 20,
  });

  const fetchTrainings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchTrainings();
  }, [triggerUpdate]);

  useEffect(() => {
    const handleFocus = () => fetchTrainings();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [fetchTrainings]);

  const handleEdit = (training) => {
    setEditingTraining(training.id);
    setFormData({
      title: training.title,
      description: training.description || "",
      trainingDate: training.trainingDate,
      durationMinutes: training.durationMinutes,
      location: training.location || "",
      sportType: training.sportType || "",
      maxParticipants: training.maxParticipants || 20,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (trainingId) => {
    if (!window.confirm("Вы уверены, что хотите удалить эту тренировку?"))
      return;

    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/trainings/${trainingId}`,
        { method: "DELETE" }
      );
      if (!response.ok) throw new Error("Ошибка удаления");
      alert("Тренировка удалена");
      fetchTrainings();
    } catch (err) {
      alert(err.message);
    }
  };

  const loadParticipants = async (training) => {
    setSelectedTraining(training);
    try {
      const response = await fetchWithAuth(
        `http://localhost:8080/api/trainings/${training.id}/participants`
      );
      if (response.ok) {
        const data = await response.json();
        setParticipants(data);
      }
    } catch (err) {
      console.error("Ошибка загрузки участников");
    }
    setShowParticipantsModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingTraining
        ? `http://localhost:8080/api/trainings/${editingTraining}`
        : "http://localhost:8080/api/trainings";

      const method = editingTraining ? "PUT" : "POST";

      const response = await fetchWithAuth(url, {
        method,
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Ошибка сохранения");

      alert(editingTraining ? "Тренировка обновлена!" : "Тренировка создана!");
      setShowCreateForm(false);
      setEditingTraining(null);
      setFormData({
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

  if (loading) return <div className="loading">Загрузка тренировок...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="trainings-page">
      <header className="header">
        <div className="container header-container">
          <div className="logo" onClick={() => navigate("/")}>
            <span className="logo-text">FORCE LAB</span>
          </div>
          <div className="header-actions">
            <button className="btn-outline" onClick={() => navigate("/")}>
              На главную
            </button>
            {userRole === "ATHLETE" && (
              <button
                className="btn-outline"
                onClick={() => navigate("/my-trainings")}
              >
                📅 Мои тренировки
              </button>
            )}
            {userRole === "COACH" && (
              <button
                className="btn-primary"
                onClick={() => {
                  setEditingTraining(null);
                  setFormData({
                    title: "",
                    description: "",
                    trainingDate: "",
                    durationMinutes: 60,
                    location: "",
                    sportType: "",
                    maxParticipants: 20,
                  });
                  setShowCreateForm(!showCreateForm);
                }}
              >
                {showCreateForm ? "Отмена" : "+ Создать тренировку"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <h1 className="page-title">🏋️‍♂️ Тренировки</h1>

        {showCreateForm && userRole === "COACH" && (
          <div className="create-training-form">
            <h3>
              {editingTraining
                ? "✏️ Редактирование тренировки"
                : "➕ Создание новой тренировки"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">📌 Название тренировки *</label>
                <input
                  type="text"
                  placeholder="Например: Силовая тренировка для пловцов"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">📅 Дата и время *</label>
                  <input
                    type="datetime-local"
                    value={formData.trainingDate}
                    onChange={(e) =>
                      setFormData({ ...formData, trainingDate: e.target.value })
                    }
                    required
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">⏱️ Длительность (мин)</label>
                  <input
                    type="number"
                    placeholder="60"
                    value={formData.durationMinutes}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        durationMinutes: parseInt(e.target.value),
                      })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">🏋️ Вид спорта *</label>
                  <select
                    value={formData.sportType}
                    onChange={(e) =>
                      setFormData({ ...formData, sportType: e.target.value })
                    }
                    required
                    className="form-input"
                  >
                    <option value="">Выберите вид спорта...</option>
                    <option value="Футбол">⚽ Футбол</option>
                    <option value="Баскетбол">🏀 Баскетбол</option>
                    <option value="Волейбол">🏐 Волейбол</option>
                    <option value="Теннис">🎾 Теннис</option>
                    <option value="Легкая атлетика">🏃 Легкая атлетика</option>
                    <option value="Плавание">🏊 Плавание</option>
                    <option value="Бокс">🥊 Бокс</option>
                    <option value="Борьба">🤼 Борьба</option>
                    <option value="Гимнастика">🤸 Гимнастика</option>
                    <option value="ОФП">💪 ОФП</option>
                    <option value="Кроссфит">🏆 Кроссфит</option>
                    <option value="Другое">📌 Другое</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">📍 Место проведения</label>
                  <input
                    type="text"
                    placeholder="Например: Спортзал №1"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">👥 Максимум участников</label>
                <input
                  type="number"
                  placeholder="20 (оставьте пустым если без ограничений)"
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      maxParticipants: parseInt(e.target.value),
                    })
                  }
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">📝 Описание тренировки</label>
                <textarea
                  placeholder="Опишите что будет на тренировке, какие упражнения..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="form-input"
                  rows="4"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary btn-block">
                  {editingTraining
                    ? "💾 Сохранить изменения"
                    : "✅ Создать тренировку"}
                </button>
                <button
                  type="button"
                  className="btn-outline btn-block"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTraining(null);
                  }}
                >
                  ❌ Отмена
                </button>
              </div>
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
              <div key={training.id} className="training-card">
                <div className="training-header">
                  <h3>{training.title}</h3>
                  <span className="status-badge upcoming">
                    {new Date(training.trainingDate) > new Date()
                      ? "Предстоит"
                      : "Завершена"}
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
                </div>
                <div className="training-actions">
                  {userRole === "COACH" && (
                    <>
                      <button
                        className="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadParticipants(training);
                        }}
                      >
                        👥 Участники ({training.currentParticipants || 0})
                      </button>
                      <button
                        className="btn-outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(training);
                        }}
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(training.id);
                        }}
                      >
                        🗑️
                      </button>
                    </>
                  )}

                  {userRole === "ATHLETE" && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Модальное окно с участниками */}
      {showParticipantsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowParticipantsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>👥 Участники тренировки</h3>
              <button
                className="modal-close"
                onClick={() => setShowParticipantsModal(false)}
              >
                ✕
              </button>
            </div>
            <h4>{selectedTraining?.title}</h4>
            <p className="modal-subtitle">
              {formatDate(selectedTraining?.trainingDate)} •{" "}
              {selectedTraining?.sportType}
            </p>

            {participants.length === 0 ? (
              <div className="no-data">
                <p>Пока никто не записался</p>
              </div>
            ) : (
              <div className="participants-list">
                {participants.map((p, index) => (
                  <div key={p.id || index} className="participant-item">
                    <div className="participant-number">{index + 1}</div>
                    <div className="participant-icon">🏃</div>
                    <div className="participant-info">
                      <div className="participant-name">{p.fullName}</div>
                      <div className="participant-details">
                        <span>{p.sportType}</span>
                        {p.rank && <span>• {p.rank}</span>}
                        <span>• {p.email}</span>
                      </div>
                    </div>
                    <div className="participant-badge present">Записан</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingsPage;
