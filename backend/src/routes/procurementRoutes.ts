import { Router } from 'express';
import { 
    getPurchaseRequests, createPurchaseRequest, 
    getPurchaseOrders, createPurchaseOrder, 
    createMaterialReceipt, consumeMaterial 
} from '../controllers/procurementController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

router.use(authenticateToken);

router.get('/pr', getPurchaseRequests);
router.post('/pr', createPurchaseRequest);

router.get('/po', getPurchaseOrders);
router.post('/po', createPurchaseOrder);

router.post('/receipts', createMaterialReceipt);
router.post('/consumption', consumeMaterial);

export default router;
