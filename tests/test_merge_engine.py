
# test_merge_engine.py
import unittest
from backend.engine.merge_engine import merge_session

class TestMergeEngine(unittest.TestCase):
    def test_basic(self):
        result = merge_session(["lumbar_left"], 20)
        self.assertEqual(result["status"], "ok")

if __name__ == "__main__":
    unittest.main()
