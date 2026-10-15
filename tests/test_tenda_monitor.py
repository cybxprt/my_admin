import importlib.util
import pathlib
import unittest

MODULE_PATH = pathlib.Path(__file__).parents[1] / "agents" / "local-agent" / "tenda_monitor.py"
SPEC = importlib.util.spec_from_file_location("tenda_monitor", MODULE_PATH)
monitor = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(monitor)

class TendaMonitorTests(unittest.TestCase):
    def test_rejects_public_router_target(self):
        with self.assertRaises(ValueError):
            monitor.validate_router_url("http://8.8.8.8")

    def test_rejects_credentials_in_router_url(self):
        with self.assertRaises(ValueError):
            monitor.validate_router_url("http://admin:password@192.168.0.1")

    def test_normalizes_clients_and_omits_mac_addresses(self):
        status = {
            "deviceStastics": {"routerName": "SUNNAH", "statusOnlineNumber": "2", "wifiRate": "-59"},
            "systemInfo": {"softVersion": "V12.01.01.42_multi", "lanIP": "192.168.0.1", "wanType": "pppoe", "statusWanIP": "10.1.2.3"},
            "internetStatus": {"wanConnectStatus": "13103060"},
        }
        qos = {"onlineList": [
            {"qosListHostname": "NOTE-50-PRO", "qosListIP": "192.168.0.105", "qosListConnectType": "wifi", "qosListDownSpeed": "0.00", "qosListUpSpeed": "0.00", "qosListAccess": "true", "qosListMac": "00:11:22:33:44:55"},
            {"qosListHostname": "external", "qosListIP": "8.8.8.8", "qosListMac": "00:11:22:33:44:66"},
        ]}
        snapshot = monitor.parse_snapshot(status, qos, "http://192.168.0.1")
        self.assertEqual(snapshot["router"]["name"], "SUNNAH")
        self.assertEqual(snapshot["summary"]["observedClientCount"], 1)
        self.assertEqual(snapshot["clients"][0]["ip"], "192.168.0.105")
        self.assertNotIn("mac", str(snapshot).lower())
        self.assertEqual(snapshot["router"]["wanAddressClass"], "PRIVATE_OR_UPSTREAM_NAT_POSSIBLE")

    def test_missing_fields_are_not_fabricated(self):
        snapshot = monitor.parse_snapshot({}, {}, "http://192.168.0.1")
        self.assertIsNone(snapshot["summary"]["reportedOnlineCount"])
        self.assertEqual(snapshot["clients"], [])
        self.assertEqual(snapshot["router"]["wanAddressClass"], "UNAVAILABLE")

if __name__ == "__main__":
    unittest.main()
