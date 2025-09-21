-- Create sample notifications for testing
INSERT INTO notifications (user_id, type, title, message, read, data, created_at) VALUES
-- Get the first user ID from auth.users
((SELECT id FROM auth.users LIMIT 1), 'overdue_invoice', 'Invoice Overdue', 'Invoice INV-2024-001 is now 5 days overdue. Please follow up with the client.', false, '{"invoice_id": "123", "days_overdue": 5}', NOW() - INTERVAL '2 hours'),
((SELECT id FROM auth.users LIMIT 1), 'payment_received', 'Payment Received', 'Payment of Rp 5,000,000 received for Invoice INV-2024-002.', false, '{"payment_id": "456", "amount": 5000000}', NOW() - INTERVAL '1 hour'),
((SELECT id FROM auth.users LIMIT 1), 'invoice_created', 'New Invoice Created', 'Invoice INV-2024-003 has been created for PT Maju Jaya.', true, '{"invoice_id": "789"}', NOW() - INTERVAL '3 hours'),
((SELECT id FROM auth.users LIMIT 1), 'payment_reminder', 'Payment Reminder', 'Invoice INV-2024-001 is due in 3 days. Consider sending a reminder to the client.', false, '{"invoice_id": "123", "days_until_due": 3}', NOW() - INTERVAL '4 hours'),
((SELECT id FROM auth.users LIMIT 1), 'system', 'System Update', 'Your financial dashboard has been updated with new features.', true, '{}', NOW() - INTERVAL '1 day');
