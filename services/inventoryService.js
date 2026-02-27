// inventoryService.js
const { db } = require('../firebase/init');

const inventoryService = {
    /**
     * Obtiene la tanda (batch) activa actual desde Firestore.
     * Usa un documento fijo 'active_batch' para acceso rápido y simple.
     * @param {boolean} forceRefresh - (opcional) no se usa actualmente, pero deja la puerta abierta para cache invalidation futura
     * @returns {Promise<Object|null>} Datos de la tanda activa o null si no existe
     */
    getActiveBatch: async (forceRefresh = false) => {
        try {
            const batchDoc = await db.collection('inventory').doc('active_batch').get();
            
            if (!batchDoc.exists) {
                return null;
            }

            return {
                id: batchDoc.id,
                ...batchDoc.data()
            };
        } catch (error) {
            console.error('Error al obtener tanda activa:', error);
            throw error;
        }
    },

    /**
     * (Opcional - futuro) Método para obtener todas las tandas históricas
     * Útil para reportes o cuando quieras mostrar historial de precios
     */
    getAllBatches: async () => {
        try {
            const snapshot = await db.collection('inventory')
                .where('active', '==', true)
                .orderBy('updatedAt', 'desc')
                .get();
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error al obtener todas las tandas:', error);
            throw error;
        }
    }
};

module.exports = inventoryService;