import api from "../api/api";

export const listarMinhasNotificacoes = async () => {
  const res = await api.get("/api/notifications");
  return res.data;
};

export const marcarNotificacaoComoLida = async (id) => {
  const res = await api.put(`/api/notifications/${id}/read`);
  return res.data;
};