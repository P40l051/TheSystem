// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "./Strings.sol";

import "hardhat/console.sol";

contract TheSystem is ERC1155, Ownable, ERC1155Burnable, ERC1155Supply {
    mapping(uint256 => bool) private _activeIds;
    mapping(address => uint256) private _power;
    string private _baseURI;

    uint256 public maxSupply;
    bool public mintActive;
    mapping(address => mapping(address => uint256)) public interactions;

    event NewUri(string _newURI);
    event SetMaxSupply(uint256 _value);
    event ActivateBatch(uint256[] _ids);
    event MintStatus(bool);

    // event TransferSingle(operator, from, to, id, value) ----- emitted by default for safeTransferFrom, mint, burn
    // event TransferBatch(operator, from, to, ids, values) ------ emitted by default for safeBatchTransferFrom, mintBatch, burnBach
    // event ApprovalForAll(account, operator, approved) ------ emitted by default for ApprovalForAll

    constructor() ERC1155("") {}

    function setBaseURI(string memory newuri) public onlyOwner {
        _baseURI = newuri;
        emit NewUri(newuri);
    }

    function setMaxSupply(uint256 amount) public onlyOwner {
        require(amount > maxSupply, "Revert: amount too small");
        maxSupply = amount;
        emit SetMaxSupply(maxSupply);
    }

    function changeMint() public onlyOwner {
        mintActive = !mintActive;
        emit MintStatus(mintActive);
    }

    function activateBatch(uint256[] memory ids) public onlyOwner {
        for (uint256 i = 0; i < ids.length; i++) {
            _activeIds[ids[i]] = true;
        }
        emit ActivateBatch(ids);
    }

    function uri(uint256 _id) public view override returns (string memory) {
        return Strings.strConcat(_baseURI, Strings.uint2str(_id), ".json");
    }

    function isActiveID(uint256 id) public view returns (bool) {
        return _activeIds[id];
    }

    function myPower(address _address) public view returns (uint256) {
        return _power[_address];
    }

    function mint(
        address account,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public {
        require(mintActive, "Revert: paused");
        require(_activeIds[id], "Revert: not active");
        require(
            maxSupply >= amount + totalSupply(id),
            "Revert: maxSupply exceded"
        );
        _mint(account, id, amount, data);
    }

    function mintBatch(
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public {
        require(mintActive, "Revert: paused");
        for (uint256 i = 0; i < ids.length; i++) {
            require(_activeIds[ids[i]], "Revert: not active");
            require(
                maxSupply >= amounts[i] + totalSupply(ids[i]),
                "Revert: maxSupply exceded"
            );
        }
        _mintBatch(to, ids, amounts, data);
    }

    function burn(
        address account,
        uint256 id,
        uint256 value
    ) public virtual override {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not owner"
        );
        _power[account] = _power[account] + value;
        _burn(account, id, value);
    }

    function burnBatch(
        address account,
        uint256[] memory ids,
        uint256[] memory values
    ) public virtual override {
        require(
            account == _msgSender() || isApprovedForAll(account, _msgSender()),
            "ERC1155: caller is not owner"
        );
        for (uint256 i = 0; i < ids.length; i++) {
            _power[account] = _power[account] + values[i];
        }
        _burnBatch(account, ids, values);
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        uint256 amount,
        bytes memory data
    ) public virtual override {
        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not owner"
        );

        if (interactions[from][to] >= interactions[to][from]) {
            require(_power[from] >= amount, "Revert: more _power needed");
            _safeTransferFrom(from, to, id, amount, data);
            _power[from] = _power[from] - amount;
            interactions[from][to] = interactions[from][to] + amount;
        } else {
            uint256 freetransPower = interactions[to][from] -
                interactions[from][to];
            if (amount >= freetransPower) {
                require(
                    amount <= _power[from] + freetransPower,
                    "Revert: more _power needed"
                );
                _safeTransferFrom(from, to, id, amount, data);
                _power[from] = _power[from] - (amount - freetransPower);
                interactions[from][to] = interactions[from][to] + amount;
            } else {
                _safeTransferFrom(from, to, id, amount, data);
                interactions[from][to] = interactions[from][to] + amount;
            }
        }
    }

    function safeBatchTransferFrom(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) public virtual override {
        uint256 totalAmount;

        require(
            from == _msgSender() || isApprovedForAll(from, _msgSender()),
            "ERC1155: caller is not owner"
        );
        for (uint256 i = 0; i < ids.length; i++) {
            totalAmount = totalAmount + amounts[i];
        }
        if (interactions[from][to] >= interactions[to][from]) {
            require(_power[from] >= totalAmount, "Revert: more _power needed");
            _power[from] = _power[from] - totalAmount;
            _safeBatchTransferFrom(from, to, ids, amounts, data);
            interactions[from][to] = interactions[from][to] + totalAmount;
        } else {
            uint256 freetransPower = interactions[to][from] -
                interactions[from][to];
            if (totalAmount >= freetransPower) {
                require(
                    totalAmount <= _power[from] + freetransPower,
                    "Revert: more _power needed"
                );
                _safeBatchTransferFrom(from, to, ids, amounts, data);
                _power[from] = _power[from] - (totalAmount - freetransPower);
                interactions[from][to] = interactions[from][to] + totalAmount;
            } else {
                _safeBatchTransferFrom(from, to, ids, amounts, data);
                interactions[from][to] = interactions[from][to] + totalAmount;
            }
        }
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal override(ERC1155, ERC1155Supply) {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
    }
}
